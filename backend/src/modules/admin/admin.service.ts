import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { Transaction, TransactionDocument, TransactionType } from '../../schemas/transaction.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Customer, CustomerDocument } from '../../schemas/customer.schema';
import {
  CreateAdminUserDto,
  GetUsersFilterDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UpdateAdminUserDto,
  RenewSubscriptionDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  /**
   * Tự động khởi tạo tài khoản Admin mặc định khi ứng dụng khởi động (nếu chưa có)
   */
  async onApplicationBootstrap() {
    try {
      const adminEmail = 'admin@spending.com';
      const existingAdmin = await this.userModel.findOne({ email: adminEmail });

      if (!existingAdmin) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        await this.userModel.create({
          email: adminEmail,
          passwordHash,
          fullName: 'Quản Trị Viên Hệ Thống',
          role: UserRole.ADMIN,
          isActive: true,
          hiddenMenus: [],
        });

        this.logger.log('✨ [Admin Init] Đã tự động tạo tài khoản Admin mặc định:');
        this.logger.log(`👉 Email: ${adminEmail} | Mật khẩu: admin123 | Vai trò: ADMIN`);
      }
    } catch (err) {
      this.logger.warn(`Không thể khởi tạo tài khoản admin mặc định: ${err.message}`);
    }
  }

  /**
   * Lấy số liệu thống kê toàn bộ hệ thống
   */
  async getSystemStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      personalUsers,
      salesUsers,
      adminUsers,
      activeUsers,
      blockedUsers,
      recentUsersCount,
      totalTransactions,
      transactionAgg,
      totalOrders,
      ordersAgg,
      recentUsers,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: UserRole.PERSONAL }),
      this.userModel.countDocuments({ role: UserRole.SALES }),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ isActive: { $ne: false } }),
      this.userModel.countDocuments({ isActive: false }),
      this.userModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      this.transactionModel.countDocuments(),
      this.transactionModel.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      this.orderModel.countDocuments(),
      this.orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$summary.totalSellingPrice' },
            totalProfit: { $sum: '$summary.netProfit' },
          },
        },
      ]),
      this.userModel
        .find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    if (transactionAgg && Array.isArray(transactionAgg)) {
      transactionAgg.forEach((item) => {
        if (item._id === TransactionType.INCOME) totalIncome = item.totalAmount;
        if (item._id === TransactionType.EXPENSE) totalExpense = item.totalAmount;
      });
    }

    const totalSalesRevenue = ordersAgg?.[0]?.totalRevenue || 0;
    const totalSalesProfit = ordersAgg?.[0]?.totalProfit || 0;

    return {
      users: {
        total: totalUsers,
        personal: personalUsers,
        sales: salesUsers,
        admin: adminUsers,
        active: activeUsers,
        blocked: blockedUsers,
        newLast30Days: recentUsersCount,
      },
      finance: {
        totalTransactions,
        totalIncome,
        totalExpense,
        netCashFlow: totalIncome - totalExpense,
      },
      sales: {
        totalOrders,
        totalRevenue: totalSalesRevenue,
        totalProfit: totalSalesProfit,
      },
      recentUsers,
    };
  }

  /**
   * Lấy danh sách người dùng với bộ lọc và tìm kiếm
   */
  async getUsers(filter: GetUsersFilterDto) {
    const query: any = {};

    if (filter.search && filter.search.trim()) {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    if (filter.role) {
      query.role = filter.role;
    }

    if (filter.status === 'active') {
      query.isActive = { $ne: false };
    } else if (filter.status === 'blocked') {
      query.isActive = false;
    }

    const users = await this.userModel
      .find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    return users.map((u: any) => {
      const expiresAt = u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt) : null;
      const startDate = u.subscriptionStartDate
        ? new Date(u.subscriptionStartDate)
        : u.createdAt
        ? new Date(u.createdAt)
        : now;

      let daysRemaining: number | null = null;
      let isExpired = false;
      let calculatedMonths = u.subscriptionMonths || null;

      if (expiresAt && u.role !== UserRole.ADMIN) {
        const diffTime = expiresAt.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        isExpired = daysRemaining < 0;

        // Tính số tháng chính xác dựa trên ngày bắt đầu và ngày hết hạn
        const totalDurationDays = Math.max(0, (expiresAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        calculatedMonths = Math.max(1, Math.round(totalDurationDays / 30.4375));
      }

      return {
        id: u._id.toString(),
        email: u.email,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl || '',
        currency: u.currency || 'VND',
        language: u.language || 'vi',
        role: u.role || UserRole.PERSONAL,
        isActive: u.isActive !== false,
        subscriptionMonths: calculatedMonths,
        monthlyPrice: u.monthlyPrice || 0,
        totalAmountPaid: u.totalAmountPaid || 0,
        subscriptionStartDate: u.subscriptionStartDate || null,
        subscriptionExpiresAt: u.subscriptionExpiresAt || null,
        daysRemaining,
        isExpired,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });
  }

  /**
   * Cập nhật vai trò (Role) của người dùng
   */
  async updateUserRole(userId: string, dto: UpdateUserRoleDto, currentAdminId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Nếu tự hạ quyền admin của chính mình, đảm bảo còn ít nhất 1 admin khác
    if (userId === currentAdminId && dto.role !== UserRole.ADMIN) {
      const otherAdminsCount = await this.userModel.countDocuments({
        _id: { $ne: userId },
        role: UserRole.ADMIN,
      });
      if (otherAdminsCount === 0) {
        throw new BadRequestException('Hệ thống cần ít nhất 1 Quản trị viên (Admin)');
      }
    }

    user.role = dto.role;
    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive !== false,
      message: `Đã cập nhật vai trò người dùng thành ${dto.role}`,
    };
  }

  /**
   * Khóa hoặc Mở khóa tài khoản người dùng
   */
  async updateUserStatus(userId: string, dto: UpdateUserStatusDto, currentAdminId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    if (userId === currentAdminId && !dto.isActive) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    user.isActive = dto.isActive;
    await user.save();

    return {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      message: dto.isActive
        ? 'Đã kích hoạt lại tài khoản thành công'
        : 'Đã khóa tài khoản thành công',
    };
  }

  /**
   * Chỉnh sửa thông tin người dùng (Họ tên, email, mật khẩu, vai trò, trạng thái, gói thuê bao)
   */
  async updateUser(userId: string, dto: UpdateAdminUserDto, currentAdminId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const existing = await this.userModel.findOne({
        _id: { $ne: userId },
        email: dto.email.toLowerCase().trim(),
      });
      if (existing) {
        throw new ConflictException('Email này đã được sử dụng bởi tài khoản khác');
      }
      user.email = dto.email.toLowerCase().trim();
    }

    if (dto.fullName && dto.fullName.trim()) {
      user.fullName = dto.fullName.trim();
    }

    if (dto.role) {
      if (userId === currentAdminId && dto.role !== UserRole.ADMIN) {
        const otherAdminsCount = await this.userModel.countDocuments({
          _id: { $ne: userId },
          role: UserRole.ADMIN,
        });
        if (otherAdminsCount === 0) {
          throw new BadRequestException('Hệ thống cần ít nhất 1 Quản trị viên (Admin)');
        }
      }
      user.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      if (userId === currentAdminId && !dto.isActive) {
        throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình');
      }
      user.isActive = dto.isActive;
    }

    if (dto.password && dto.password.trim()) {
      if (dto.password.length < 6) {
        throw new BadRequestException('Mật khẩu mới phải từ 6 ký tự trở lên');
      }
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    // Cập nhật thông tin gói thuê bao
    if (dto.subscriptionMonths !== undefined) {
      const months = dto.subscriptionMonths ? Number(dto.subscriptionMonths) : null;
      user.subscriptionMonths = months;
    }

    if (dto.monthlyPrice !== undefined) {
      user.monthlyPrice = Number(dto.monthlyPrice);
    }

    if (dto.subscriptionExpiresAt !== undefined) {
      user.subscriptionExpiresAt = dto.subscriptionExpiresAt ? new Date(dto.subscriptionExpiresAt) : null;
      if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > new Date()) {
        user.isActive = true;
      }
    }

    const updated = await user.save();

    return {
      id: updated._id.toString(),
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      isActive: updated.isActive !== false,
      subscriptionMonths: updated.subscriptionMonths,
      monthlyPrice: updated.monthlyPrice,
      totalAmountPaid: updated.totalAmountPaid,
      subscriptionStartDate: updated.subscriptionStartDate,
      subscriptionExpiresAt: updated.subscriptionExpiresAt,
      avatarUrl: updated.avatarUrl || '',
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt,
      message: 'Cập nhật thông tin người dùng thành công',
    };
  }

  /**
   * Gia hạn gói thuê bao người dùng
   */
  async renewSubscription(userId: string, dto: RenewSubscriptionDto) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const months = Number(dto.months) || 1;
    const now = new Date();

    // Nếu còn hạn thì cộng tiếp từ ngày hết hạn, nếu đã hết hạn thì tính từ hôm nay
    let baseDate = now;
    if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now) {
      baseDate = new Date(user.subscriptionExpiresAt);
    }

    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    if (dto.monthlyPrice !== undefined && dto.monthlyPrice >= 0) {
      user.monthlyPrice = Number(dto.monthlyPrice);
    }

    const addedAmount = (user.monthlyPrice || 0) * months;
    user.subscriptionExpiresAt = newExpiry;
    user.subscriptionMonths = (user.subscriptionMonths || 0) + months;
    user.totalAmountPaid = (user.totalAmountPaid || 0) + addedAmount;
    user.isActive = true; // Mở lại tài khoản

    const saved = await user.save();

    const formattedDate = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(newExpiry);

    return {
      id: saved._id.toString(),
      email: saved.email,
      fullName: saved.fullName,
      subscriptionExpiresAt: saved.subscriptionExpiresAt,
      subscriptionMonths: saved.subscriptionMonths,
      monthlyPrice: saved.monthlyPrice,
      totalAmountPaid: saved.totalAmountPaid,
      isActive: saved.isActive,
      message: `Đã gia hạn thành công ${months} tháng đến ngày ${formattedDate}`,
    };
  }

  /**
   * Tạo tài khoản mới từ trang Admin (với gói thuê bao & số tiền tự do nhập)
   */
  async createUser(dto: CreateAdminUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const startDate = dto.subscriptionStartDate ? new Date(dto.subscriptionStartDate) : new Date();
    const months = dto.subscriptionMonths !== undefined && dto.subscriptionMonths !== null ? Number(dto.subscriptionMonths) : null;
    const monthlyPrice = dto.monthlyPrice !== undefined && dto.monthlyPrice !== null ? Number(dto.monthlyPrice) : 0;
    
    let expiresAt: Date | null = null;
    let totalAmount = 0;

    if (months && months > 0) {
      expiresAt = new Date(startDate);
      expiresAt.setMonth(expiresAt.getMonth() + months);
      totalAmount = monthlyPrice * months;
    } else {
      totalAmount = monthlyPrice;
    }

    const newUser = new this.userModel({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role || UserRole.PERSONAL,
      isActive: true,
      hiddenMenus: [],
      subscriptionMonths: months,
      monthlyPrice,
      totalAmountPaid: totalAmount,
      subscriptionStartDate: startDate,
      subscriptionExpiresAt: expiresAt,
    });

    const saved = await newUser.save();

    return {
      id: saved._id.toString(),
      email: saved.email,
      fullName: saved.fullName,
      role: saved.role,
      isActive: saved.isActive,
      subscriptionMonths: saved.subscriptionMonths,
      monthlyPrice: saved.monthlyPrice,
      totalAmountPaid: saved.totalAmountPaid,
      subscriptionStartDate: saved.subscriptionStartDate,
      subscriptionExpiresAt: saved.subscriptionExpiresAt,
      createdAt: (saved as any).createdAt,
      message: 'Tạo tài khoản người dùng mới thành công',
    };
  }

  /**
   * Lấy chi tiết thông tin người dùng, danh sách khách hàng và thống kê doanh thu/giao dịch
   */
  async getUserDetail(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    const user = await this.userModel.findById(userId).lean();
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const now = new Date();
    const isForever = user.role === UserRole.ADMIN || !user.subscriptionExpiresAt;
    const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    const startDate = user.subscriptionStartDate
      ? new Date(user.subscriptionStartDate)
      : (user as any).createdAt
      ? new Date((user as any).createdAt)
      : now;

    const isExpired = !isForever && expiresAt ? now > expiresAt : false;
    let daysRemaining: number | null = null;
    let calculatedMonths = user.subscriptionMonths || null;

    if (!isForever && expiresAt) {
      const diffTime = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const totalDurationDays = Math.max(0, (expiresAt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      calculatedMonths = Math.max(1, Math.round(totalDurationDays / 30.4375));
    }

    const userObjectId = new Types.ObjectId(userId);

    // 1. Lấy danh sách khách hàng của user
    const [customers, totalCustomers, customerDebtAgg] = await Promise.all([
      this.customerModel
        .find({ userId: userObjectId })
        .sort({ updatedAt: -1 })
        .limit(100)
        .lean(),
      this.customerModel.countDocuments({ userId: userObjectId }),
      this.customerModel.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, totalDebt: { $sum: '$debtAmount' }, totalSpent: { $sum: '$totalSpent' } } },
      ]),
    ]);

    const totalCustomerDebt = customerDebtAgg.length > 0 ? customerDebtAgg[0].totalDebt || 0 : 0;
    const totalCustomerSpent = customerDebtAgg.length > 0 ? customerDebtAgg[0].totalSpent || 0 : 0;

    // 2. Lấy thống kê đơn hàng và doanh thu (Sales)
    const [orders, totalOrders, orderAgg] = await Promise.all([
      this.orderModel
        .find({ userId: userObjectId })
        .sort({ orderDate: -1, createdAt: -1 })
        .limit(50)
        .lean(),
      this.orderModel.countDocuments({ userId: userObjectId }),
      this.orderModel.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: null,
            totalSalesRevenue: { $sum: '$totalAmount' },
            totalPaidRevenue: { $sum: '$paidAmount' },
            totalCost: { $sum: '$costPrice' },
            totalShipping: { $sum: '$shippingFee' },
          },
        },
      ]),
    ]);

    const salesStats = orderAgg.length > 0 ? orderAgg[0] : {
      totalSalesRevenue: 0,
      totalPaidRevenue: 0,
      totalCost: 0,
      totalShipping: 0,
    };
    const totalProfit = (salesStats.totalSalesRevenue || 0) - (salesStats.totalCost || 0) - (salesStats.totalShipping || 0);

    // 3. Lấy giao dịch cá nhân (Personal Transactions)
    const [transactions, totalTransactions, transactionAgg] = await Promise.all([
      this.transactionModel
        .find({ userId: userObjectId })
        .sort({ date: -1, createdAt: -1 })
        .limit(50)
        .lean(),
      this.transactionModel.countDocuments({ userId: userObjectId }),
      this.transactionModel.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    transactionAgg.forEach((item: any) => {
      if (item._id === TransactionType.INCOME) totalIncome = item.totalAmount;
      if (item._id === TransactionType.EXPENSE) totalExpense = item.totalAmount;
    });

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive !== false,
        subscriptionMonths: calculatedMonths,
        monthlyPrice: user.monthlyPrice || 0,
        totalAmountPaid: user.totalAmountPaid || 0,
        subscriptionStartDate: user.subscriptionStartDate || null,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        daysRemaining,
        isExpired,
        isForever,
        hiddenMenus: user.hiddenMenus || [],
        avatarUrl: user.avatarUrl || '',
        currency: user.currency || 'VND',
        createdAt: (user as any).createdAt,
      },
      customers: {
        total: totalCustomers,
        totalDebt: totalCustomerDebt,
        totalSpent: totalCustomerSpent,
        list: customers.map((c: any) => ({
          id: c._id.toString(),
          name: c.name,
          phone: c.phone || '',
          group: c.group,
          totalSpent: c.totalSpent || 0,
          totalOrders: c.totalOrders || 0,
          debtAmount: c.debtAmount || 0,
          lastOrderDate: c.lastOrderDate || null,
          note: c.note || '',
          address: c.address || '',
          facebookUrl: c.facebookUrl || '',
          zaloPhone: c.zaloPhone || '',
          createdAt: c.createdAt,
        })),
      },
      revenue: {
        sales: {
          totalOrders,
          totalSalesRevenue: salesStats.totalSalesRevenue || 0,
          totalPaidRevenue: salesStats.totalPaidRevenue || 0,
          totalCost: salesStats.totalCost || 0,
          totalShipping: salesStats.totalShipping || 0,
          totalProfit,
          recentOrders: orders.map((o: any) => ({
            id: o._id.toString(),
            orderCode: o.orderCode,
            title: o.title,
            totalAmount: o.totalAmount || 0,
            paidAmount: o.paidAmount || 0,
            costPrice: o.costPrice || 0,
            shippingFee: o.shippingFee || 0,
            status: o.status,
            paymentStatus: o.paymentStatus,
            orderDate: o.orderDate,
            customerName: o.customerName || '',
            customerPhone: o.customerPhone || '',
            customersCount: o.customers?.length || 0,
          })),
        },
        personal: {
          totalTransactions,
          totalIncome,
          totalExpense,
          balance: totalIncome - totalExpense,
          recentTransactions: transactions.map((t: any) => ({
            id: t._id.toString(),
            type: t.type,
            amount: t.amount,
            date: t.date,
            note: t.note || '',
            tags: t.tags || [],
          })),
        },
      },
    };
  }

  /**
   * Xóa vĩnh viễn tài khoản người dùng
   */
  async deleteUser(userId: string, currentAdminId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ');
    }

    if (userId === currentAdminId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản của chính mình');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.userModel.findByIdAndDelete(userId);

    return {
      id: userId,
      message: 'Đã xóa tài khoản người dùng thành công',
    };
  }
}
