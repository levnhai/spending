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
import {
  CreateAdminUserDto,
  GetUsersFilterDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
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

    return users.map((u: any) => ({
      id: u._id.toString(),
      email: u.email,
      fullName: u.fullName,
      avatarUrl: u.avatarUrl || '',
      currency: u.currency || 'VND',
      language: u.language || 'vi',
      role: u.role || UserRole.PERSONAL,
      isActive: u.isActive !== false,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
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
   * Tạo tài khoản mới từ trang Admin
   */
  async createUser(dto: CreateAdminUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase().trim() });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const newUser = new this.userModel({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role || UserRole.PERSONAL,
      isActive: true,
      hiddenMenus: [],
    });

    const saved = await newUser.save();

    return {
      id: saved._id.toString(),
      email: saved.email,
      fullName: saved.fullName,
      role: saved.role,
      isActive: saved.isActive,
      createdAt: (saved as any).createdAt,
      message: 'Tạo tài khoản người dùng mới thành công',
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
