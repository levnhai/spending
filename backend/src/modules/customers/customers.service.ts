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

  async findOne(userId: string, id: string, isAdmin = false) {
    const filter: any = { _id: id };
    if (!isAdmin || userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const customer = await this.customerModel.findOne(filter).exec();
    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng');
    }

    // Tìm tất cả đơn hàng liên quan đến khách hàng này theo tên / phone / fb
    const orderFilter: any = {
      userId: customer.userId,
      status: { $ne: OrderStatus.CANCELLED },
      $or: [
        { 'customers.name': customer.name },
        ...(customer.phone ? [{ 'customers.phone': customer.phone }] : []),
        ...(customer.facebookUrl ? [{ 'customers.facebookUrl': customer.facebookUrl }] : []),
        { customerName: customer.name },
        ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
      ],
    };

    const relatedOrders = await this.orderModel
      .find(orderFilter)
      .sort({ orderDate: -1, createdAt: -1 })
      .limit(30)
      .exec();

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

    const orderFilter: any = {
      userId: new Types.ObjectId(userId),
      status: { $ne: OrderStatus.CANCELLED },
      $or: [
        { 'customers.name': customer.name },
        ...(customer.phone ? [{ 'customers.phone': customer.phone }] : []),
        ...(customer.facebookUrl ? [{ 'customers.facebookUrl': customer.facebookUrl }] : []),
        { customerName: customer.name },
        ...(customer.phone ? [{ customerPhone: customer.phone }] : []),
      ],
    };

    const orders = await this.orderModel.find(orderFilter).exec();

    let totalSpent = 0;
    let debtAmount = 0;
    let totalOrders = orders.length;
    let latestOrderDate: Date | null = null;

    for (const order of orders) {
      const orderDate = order.orderDate ? new Date(order.orderDate) : null;
      if (orderDate && (!latestOrderDate || orderDate > latestOrderDate)) {
        latestOrderDate = orderDate;
      }

      // Kiểm tra sub-document customers trong order
      const matchedCust = order.customers?.find(
        (c) =>
          c.name === customer.name ||
          (customer.phone && c.phone === customer.phone) ||
          (customer.facebookUrl && c.facebookUrl === customer.facebookUrl),
      );

      if (matchedCust) {
        const custAmount = matchedCust.amount || 0;
        const custPaid = matchedCust.paidAmount || 0;
        totalSpent += custAmount;
        debtAmount += Math.max(0, custAmount - custPaid);
      } else {
        const orderAmount = order.totalAmount || 0;
        const orderPaid = order.paidAmount || 0;
        totalSpent += orderAmount;
        debtAmount += Math.max(0, orderAmount - orderPaid);
      }
    }

    customer.totalSpent = totalSpent;
    customer.debtAmount = debtAmount;
    customer.totalOrders = totalOrders;
    if (latestOrderDate) {
      customer.lastOrderDate = latestOrderDate;
    }

    return customer.save();
  }
}
