import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from '../../schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'all';

function calculateDateRange(period?: string, fromDate?: string, toDate?: string) {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (period === 'week') {
    // Thứ 2 đầu tuần (0 = Sunday, 1 = Monday...)
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday + 6, 23, 59, 59, 999);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else if (fromDate || toDate) {
    if (fromDate) startDate = new Date(fromDate);
    if (toDate) {
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    }
  }

  return { startDate, endDate };
}

import { AppCacheService } from '../../common/cache/app-cache.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly cacheService: AppCacheService,
  ) {}

  async findAll(
    userId: string,
    query?: {
      search?: string;
      status?: string;
      period?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (query?.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query?.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { orderCode: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { note: searchRegex },
        { 'customers.name': searchRegex },
        { 'customers.phone': searchRegex },
        { 'customers.facebookUrl': searchRegex },
        { 'customers.note': searchRegex },
      ];
    }

    const { startDate, endDate } = calculateDateRange(query?.period, query?.fromDate, query?.toDate);
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = startDate;
      if (endDate) filter.orderDate.$lte = endDate;
    }

    return this.orderModel.find(filter).sort({ orderDate: -1, createdAt: -1 }).exec();
  }

  async getStats(
    userId: string,
    query?: {
      period?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const periodKey = query?.period || (query?.fromDate ? `${query.fromDate}_${query?.toDate}` : 'all');
    const cacheKey = `orders:${userId}:${periodKey}`;

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const userObjId = new Types.ObjectId(userId);
        const filter: any = { userId: userObjId };

        const { startDate, endDate } = calculateDateRange(query?.period, query?.fromDate, query?.toDate);
        if (startDate || endDate) {
          filter.orderDate = {};
          if (startDate) filter.orderDate.$gte = startDate;
          if (endDate) filter.orderDate.$lte = endDate;
        }

        const orders = await this.orderModel.find(filter).exec();

        const totalOrders = orders.length;
        const activeOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);

        // 1. Tổng doanh thu (Gross Revenue)
        const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        // 2. Tổng phí vận chuyển (Shipping Fee)
        const totalShippingFee = activeOrders.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
        // 3. Tổng tiền vốn (Cost Price)
        const totalCostPrice = activeOrders.reduce((sum, o) => sum + (o.costPrice || 0), 0);

        // 4. Doanh thu thuần = Tổng doanh thu - Phí ship
        const netRevenue = Math.max(0, totalRevenue - totalShippingFee);

        // 5. Lợi nhuận = Tổng doanh thu - Phí ship - Tiền vốn (hoặc Doanh thu thuần - Tiền vốn)
        const profit = totalRevenue - totalShippingFee - totalCostPrice;

        // 6. Tỷ suất lợi nhuận = (Lợi nhuận / Tổng doanh thu) * 100%
        const profitMargin = totalRevenue > 0 ? Number(((profit / totalRevenue) * 100).toFixed(1)) : 0;

        // Thanh toán & công nợ
        const totalPaid = activeOrders.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
        const totalRemaining = Math.max(0, totalRevenue - totalPaid);

        // Trạng thái đơn
        const orderedCount = orders.filter((o) => o.status === OrderStatus.ORDERED).length;
        const vnWarehouseCount = orders.filter((o) => o.status === OrderStatus.VN_WAREHOUSE).length;
        const atHomeCount = orders.filter((o) => o.status === OrderStatus.AT_HOME).length;
        const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
        const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;

        const inProgressCount = orderedCount + vnWarehouseCount + atHomeCount;
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

        return {
          totalOrders,
          totalRevenue,       // Tổng doanh thu
          totalShippingFee,   // Phí vận chuyển
          totalCostPrice,     // Tiền vốn
          netRevenue,         // Doanh thu thuần
          profit,             // Lợi nhuận
          profitMargin,       // Tỷ suất lợi nhuận (%)
          totalPaid,          // Thực thu đã thanh toán
          totalRemaining,     // Công nợ còn lại
          orderedCount,
          vnWarehouseCount,
          atHomeCount,
          inProgressCount,
          completedOrders,
          cancelledOrders,
          completionRate,
          period: query?.period || 'all',
        };
      },
      30, // TTL 30 giây
    );
  }

  async findOne(id: string, userId: string) {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const count = await this.orderModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const orderCode =
      dto.orderCode && dto.orderCode.trim()
        ? dto.orderCode.trim()
        : `DH-${String(count + 1).padStart(4, '0')}`;

    const customers = (dto.customers || []).map((c) => {
      const amount = c.amount || 0;
      const paidAmount = c.paidAmount || 0;
      let paymentStatus = c.paymentStatus || PaymentStatus.UNPAID;
      if (paidAmount >= amount && amount > 0) {
        paymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0 && paidAmount < amount) {
        paymentStatus = PaymentStatus.PARTIAL;
      }

      return {
        name: c.name,
        phone: c.phone || '',
        facebookUrl: c.facebookUrl || '',
        amount,
        paidAmount,
        orderDate: c.orderDate ? new Date(c.orderDate) : new Date(),
        status: c.status || OrderStatus.ORDERED,
        paymentStatus,
        note: c.note || '',
      };
    });

    const calculatedTotal = customers.reduce((sum, c) => sum + (c.amount || 0), 0);
    const calculatedPaid = customers.reduce((sum, c) => sum + (c.paidAmount || 0), 0);

    const totalAmount = dto.totalAmount !== undefined && dto.totalAmount > 0 ? dto.totalAmount : calculatedTotal;
    const paidAmount = dto.paidAmount !== undefined && dto.paidAmount > 0 ? dto.paidAmount : calculatedPaid;

    let orderPaymentStatus = PaymentStatus.UNPAID;
    if (paidAmount >= totalAmount && totalAmount > 0) {
      orderPaymentStatus = PaymentStatus.PAID;
    } else if (paidAmount > 0) {
      orderPaymentStatus = PaymentStatus.PARTIAL;
    }

    const primaryCust = customers[0];

    const newOrder = new this.orderModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      orderCode,
      customers,
      totalAmount,
      paidAmount,
      costPrice: dto.costPrice || 0,
      shippingFee: dto.shippingFee || 0,
      paymentStatus: orderPaymentStatus,
      customerName: primaryCust?.name || '',
      customerPhone: primaryCust?.phone || '',
      orderDate: primaryCust?.orderDate || (dto.orderDate ? new Date(dto.orderDate) : new Date()),
      status: primaryCust?.status || dto.status || OrderStatus.ORDERED,
      note: primaryCust?.note || dto.note || '',
    });

    const saved = await newOrder.save();
    await this.cacheService.invalidateUser(userId, ['orders', 'analytics']);
    return saved;
  }

  async update(id: string, userId: string, dto: UpdateOrderDto) {
    const updateData: any = { ...dto };

    if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice;
    if (dto.shippingFee !== undefined) updateData.shippingFee = dto.shippingFee;

    if (dto.customers && dto.customers.length > 0) {
      updateData.customers = dto.customers.map((c) => {
        const amount = c.amount || 0;
        const paidAmount = c.paidAmount || 0;
        let paymentStatus = c.paymentStatus || PaymentStatus.UNPAID;
        if (paidAmount >= amount && amount > 0) {
          paymentStatus = PaymentStatus.PAID;
        } else if (paidAmount > 0 && paidAmount < amount) {
          paymentStatus = PaymentStatus.PARTIAL;
        }

        return {
          name: c.name,
          phone: c.phone || '',
          facebookUrl: c.facebookUrl || '',
          amount,
          paidAmount,
          orderDate: c.orderDate ? new Date(c.orderDate) : new Date(),
          status: c.status || OrderStatus.ORDERED,
          paymentStatus,
          note: c.note || '',
        };
      });

      const calculatedTotal = updateData.customers.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const calculatedPaid = updateData.customers.reduce((sum: number, c: any) => sum + (c.paidAmount || 0), 0);

      updateData.totalAmount = dto.totalAmount !== undefined && dto.totalAmount > 0 ? dto.totalAmount : calculatedTotal;
      updateData.paidAmount = dto.paidAmount !== undefined && dto.paidAmount > 0 ? dto.paidAmount : calculatedPaid;

      if (updateData.paidAmount >= updateData.totalAmount && updateData.totalAmount > 0) {
        updateData.paymentStatus = PaymentStatus.PAID;
      } else if (updateData.paidAmount > 0) {
        updateData.paymentStatus = PaymentStatus.PARTIAL;
      } else {
        updateData.paymentStatus = PaymentStatus.UNPAID;
      }

      const primaryCust = updateData.customers[0];
      if (primaryCust) {
        updateData.customerName = primaryCust.name;
        updateData.customerPhone = primaryCust.phone || '';
        updateData.orderDate = primaryCust.orderDate;
        updateData.status = primaryCust.status;
      }
    }

    const updated = await this.orderModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    await this.cacheService.invalidateUser(userId, ['orders', 'analytics']);
    return updated;
  }

  async updateStatus(id: string, userId: string, status: OrderStatus) {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    const updatedCustomers = (order.customers || []).map((c: any) => ({
      name: c.name,
      phone: c.phone,
      facebookUrl: c.facebookUrl || '',
      amount: c.amount,
      paidAmount: c.paidAmount || 0,
      orderDate: c.orderDate,
      status,
      paymentStatus: c.paymentStatus,
      note: c.note,
    }));

    order.status = status;
    order.customers = updatedCustomers as any;
    const saved = await order.save();
    await this.cacheService.invalidateUser(userId, ['orders', 'analytics']);
    return saved;
  }

  async remove(id: string, userId: string) {
    const deleted = await this.orderModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    await this.cacheService.invalidateUser(userId, ['orders', 'analytics']);
    return { message: 'Xóa đơn hàng thành công' };
  }
}
