import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument, CustomerGroup } from '../../schemas/customer.schema';
import { Order, OrderDocument, OrderStatus } from '../../schemas/order.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(userId: string, dto: CreateCustomerDto): Promise<CustomerDocument> {
    const createdCustomer = new this.customerModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return createdCustomer.save();
  }

  async findAll(userId: string, query: QueryCustomerDto, isAdmin = false): Promise<CustomerDocument[]> {
    const filter: any = {};
    if (!isAdmin || userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    if (query.group) {
      filter.group = query.group;
    }

    if (query.hasDebt === 'true') {
      filter.debtAmount = { $gt: 0 };
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { facebookUrl: searchRegex },
        { zaloPhone: searchRegex },
        { address: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    let sortOption: any = { updatedAt: -1 };
    if (query.sortBy === 'debtAmount_desc') {
      sortOption = { debtAmount: -1, updatedAt: -1 };
    } else if (query.sortBy === 'totalSpent_desc') {
      sortOption = { totalSpent: -1, updatedAt: -1 };
    } else if (query.sortBy === 'name_asc') {
      sortOption = { name: 1 };
    } else if (query.sortBy === 'createdAt_desc') {
      sortOption = { createdAt: -1 };
    }

    return this.customerModel.find(filter).sort(sortOption).exec();
  }

  async getStats(userId: string, isAdmin = false) {
    const filter: any = {};
    if (!isAdmin || userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const customers = await this.customerModel.find(filter).exec();

    const totalCustomers = customers.length;
    let totalDebt = 0;
    let debtorsCount = 0;
    let totalSpent = 0;

    const groupCounts: Record<string, number> = {
      VIP: 0,
      REGULAR: 0,
      WHOLESALE: 0,
      RETAIL: 0,
      BAD_DEBT: 0,
    };

    for (const c of customers) {
      const debt = c.debtAmount || 0;
      const spent = c.totalSpent || 0;
      totalDebt += debt;
      totalSpent += spent;

      if (debt > 0) {
        debtorsCount++;
      }

      if (c.group && groupCounts[c.group] !== undefined) {
        groupCounts[c.group]++;
      }
    }

    // Top 5 khách hàng chi tiêu nhiều nhất
    const topVipCustomers = [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 5);

    // Top 5 khách hàng nợ nhiều nhất
    const topDebtors = [...customers]
      .filter((c) => (c.debtAmount || 0) > 0)
      .sort((a, b) => (b.debtAmount || 0) - (a.debtAmount || 0))
      .slice(0, 5);

    return {
      totalCustomers,
      totalDebt,
      debtorsCount,
      totalSpent,
      groupCounts,
      topVipCustomers,
      topDebtors,
    };
  }

  /**
   * Tạo filter MongoDB để tìm tất cả đơn hàng liên quan đến khách hàng
   */
  private buildCustomerOrderFilter(customer: CustomerDocument | Customer, userId: Types.ObjectId | string) {
    const conditions: any[] = [];
    const userObjId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    if (customer.name && customer.name.trim()) {
      const escapedName = customer.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameRegex = new RegExp(`^${escapedName}$`, 'i');
      conditions.push({ 'customers.name': nameRegex });
      conditions.push({ customerName: nameRegex });
    }

    if (customer.phone && customer.phone.trim()) {
      const p = customer.phone.trim();
      conditions.push({ 'customers.phone': p });
      conditions.push({ customerPhone: p });
    }

    if (customer.facebookUrl && customer.facebookUrl.trim()) {
      const fb = customer.facebookUrl.trim();
      conditions.push({ 'customers.facebookUrl': fb });
      conditions.push({ customerFacebookUrl: fb });
      conditions.push({ facebookUrl: fb });
    }

    if (conditions.length === 0) {
      return { _id: null };
    }

    return {
      userId: userObjId,
      status: { $ne: OrderStatus.CANCELLED },
      $or: conditions,
    };
  }

  /**
   * Tính toán thống kê tài chính (tổng mua, đã trả, nợ, số đơn, ngày mua gần nhất) cho khách hàng từ danh sách đơn hàng
   */
  private computeStatsFromOrders(customer: CustomerDocument | Customer, orders: OrderDocument[]) {
    let totalSpent = 0;
    let paidAmount = 0;
    let debtAmount = 0;
    let totalOrders = 0;
    let latestOrderDate: Date | null = null;

    const custNameNorm = customer.name?.trim().toLowerCase();
    const custPhoneNorm = customer.phone?.trim();
    const custFbNorm = customer.facebookUrl?.trim().toLowerCase();

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELLED) continue;

      const orderDate = order.orderDate
        ? new Date(order.orderDate)
        : new Date((order as any).createdAt || Date.now());

      if (!latestOrderDate || orderDate > latestOrderDate) {
        latestOrderDate = orderDate;
      }

      // Kiểm tra trong mảng order.customers
      const matchedCustomers = (order.customers || []).filter((c) => {
        const cName = c.name?.trim().toLowerCase();
        const cPhone = c.phone?.trim();
        const cFb = c.facebookUrl?.trim().toLowerCase();

        return (
          (custNameNorm && cName === custNameNorm) ||
          (custPhoneNorm && cPhone && cPhone === custPhoneNorm) ||
          (custFbNorm && cFb && cFb === custFbNorm)
        );
      });

      if (matchedCustomers.length > 0) {
        let orderCustTotal = 0;
        let orderCustPaid = 0;
        for (const mc of matchedCustomers) {
          const isSubCompleted = mc.status === OrderStatus.COMPLETED || order.status === OrderStatus.COMPLETED;
          const amt = mc.amount || 0;
          const paid = isSubCompleted ? amt : (mc.paidAmount || 0);
          orderCustTotal += amt;
          orderCustPaid += paid;
        }
        totalSpent += orderCustTotal;
        paidAmount += orderCustPaid;
        debtAmount += Math.max(0, orderCustTotal - orderCustPaid);
        totalOrders += 1;
      } else {
        // Nếu không có sub-document customers match nhưng đơn hàng được query ra
        const orderCustName = (order.customerName || '').trim().toLowerCase();
        const orderCustPhone = (order.customerPhone || '').trim();
        const isRootMatch =
          (custNameNorm && orderCustName === custNameNorm) ||
          (custPhoneNorm && orderCustPhone && orderCustPhone === custPhoneNorm);

        if (isRootMatch || (!order.customers || order.customers.length === 0)) {
          const isOrdCompleted = order.status === OrderStatus.COMPLETED;
          const orderTotal = order.totalAmount || 0;
          const orderPaid = isOrdCompleted ? orderTotal : (order.paidAmount || 0);
          totalSpent += orderTotal;
          paidAmount += orderPaid;
          debtAmount += Math.max(0, orderTotal - orderPaid);
          totalOrders += 1;
        }
      }
    }

    return {
      totalSpent,
      paidAmount,
      debtAmount,
      totalOrders,
      lastOrderDate: latestOrderDate,
    };
  }

  async findOne(userId: string, id: string, isAdmin = false) {
    const filter: any = { _id: id };
    if (!isAdmin || userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const customer = await this.customerModel.findOne(filter).exec();
    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    const orderFilter = this.buildCustomerOrderFilter(customer, customer.userId);
    const relatedOrders = await this.orderModel
      .find(orderFilter)
      .sort({ orderDate: -1, createdAt: -1 })
      .limit(100)
      .exec();

    // Tự động tính toán lại thống kê thực tế từ các đơn hàng
    const stats = this.computeStatsFromOrders(customer, relatedOrders);

    // Cập nhật customer document
    customer.totalSpent = stats.totalSpent;
    customer.debtAmount = stats.debtAmount;
    customer.totalOrders = stats.totalOrders;
    if (stats.lastOrderDate) {
      customer.lastOrderDate = stats.lastOrderDate;
    }

    // Lưu ngầm cập nhật DB để các trang khác cũng nhận giá trị chính xác
    await this.customerModel.updateOne(
      { _id: customer._id },
      {
        $set: {
          totalSpent: stats.totalSpent,
          debtAmount: stats.debtAmount,
          totalOrders: stats.totalOrders,
          ...(stats.lastOrderDate ? { lastOrderDate: stats.lastOrderDate } : {}),
        },
      },
    );

    return {
      customer,
      relatedOrders,
    };
  }

  async update(userId: string, id: string, dto: UpdateCustomerDto, isAdmin = false): Promise<CustomerDocument> {
    const filter: any = { _id: id };
    if (!isAdmin || userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const updated = await this.customerModel
      .findOneAndUpdate(filter, { $set: dto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Không tìm thấy khách hàng để cập nhật');
    }

    return updated;
  }

  async remove(userId: string, id: string, isAdmin = false): Promise<{ message: string }> {
    const filter: any = { _id: id };
    if (!isAdmin || userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const res = await this.customerModel.findOneAndDelete(filter).exec();
    if (!res) {
      throw new NotFoundException('Không tìm thấy khách hàng để xóa');
    }

    return { message: 'Đã xóa khách hàng thành công' };
  }

  /**
   * Đồng bộ lại số liệu thống kê (tổng chi tiêu, tổng đơn, công nợ) của khách hàng từ danh sách đơn hàng thực tế
   */
  async syncStatsFromOrders(userId: string, customerId: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findOne({
      _id: customerId,
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const orderFilter = this.buildCustomerOrderFilter(customer, customer.userId);
    const orders = await this.orderModel.find(orderFilter).exec();
    const stats = this.computeStatsFromOrders(customer, orders);

    customer.totalSpent = stats.totalSpent;
    customer.debtAmount = stats.debtAmount;
    customer.totalOrders = stats.totalOrders;
    if (stats.lastOrderDate) {
      customer.lastOrderDate = stats.lastOrderDate;
    }

    return customer.save();
  }

  /**
   * Đồng bộ tất cả khách hàng của user từ các đơn hàng hiện có
   */
  async syncAllStats(userId: string): Promise<{ updatedCount: number; message: string }> {
    const userObjId = new Types.ObjectId(userId);
    const customers = await this.customerModel.find({ userId: userObjId }).exec();
    let updatedCount = 0;

    for (const customer of customers) {
      const orderFilter = this.buildCustomerOrderFilter(customer, userObjId);
      const orders = await this.orderModel.find(orderFilter).exec();
      const stats = this.computeStatsFromOrders(customer, orders);

      await this.customerModel.updateOne(
        { _id: customer._id },
        {
          $set: {
            totalSpent: stats.totalSpent,
            debtAmount: stats.debtAmount,
            totalOrders: stats.totalOrders,
            ...(stats.lastOrderDate ? { lastOrderDate: stats.lastOrderDate } : {}),
          },
        },
      );
      updatedCount++;
    }

    return {
      updatedCount,
      message: `Đã đồng bộ thành công số liệu tài chính cho ${updatedCount} khách hàng`,
    };
  }
}
