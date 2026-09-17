import { Injectable, NotFoundException, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from '../../schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UploadService } from '../upload/upload.service';

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

function buildProfitTimeline(orders: OrderDocument[], period: string = 'all') {
  const activeOrders = orders.filter((o) => o.status !== OrderStatus.CANCELLED);
  const now = new Date();

  if (period === 'today') {
    // 8 khung giờ trong ngày: 0h-3h, 3h-6h, 6h-9h, 9h-12h, 12h-15h, 15h-18h, 18h-21h, 21h-24h
    const timeSlots = [
      { label: '0h-3h', minHour: 0, maxHour: 3, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '3h-6h', minHour: 3, maxHour: 6, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '6h-9h', minHour: 6, maxHour: 9, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '9h-12h', minHour: 9, maxHour: 12, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '12h-15h', minHour: 12, maxHour: 15, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '15h-18h', minHour: 15, maxHour: 18, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '18h-21h', minHour: 18, maxHour: 21, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: '21h-24h', minHour: 21, maxHour: 24, profit: 0, revenue: 0, cost: 0, shipping: 0 },
    ];

    for (const order of activeOrders) {
      const d = order.orderDate ? new Date(order.orderDate) : new Date((order as any).createdAt || now);
      const h = d.getHours();
      const slot = timeSlots.find((s) => h >= s.minHour && h < s.maxHour) || timeSlots[timeSlots.length - 1];
      const rev = order.totalAmount || 0;
      const ship = order.shippingFee || 0;
      const cost = order.costPrice || 0;
      slot.revenue += rev;
      slot.shipping += ship;
      slot.cost += cost;
      slot.profit += rev - ship - cost;
    }

    return timeSlots.map((s) => ({
      label: s.label,
      revenue: s.revenue,
      cost: s.cost,
      shipping: s.shipping,
      profit: s.profit,
    }));
  }

  if (period === 'week') {
    // 7 ngày trong tuần: Thứ 2 đến Chủ Nhật
    const days = [
      { label: 'Thứ 2', dayIndex: 1, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: 'Thứ 3', dayIndex: 2, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: 'Thứ 4', dayIndex: 3, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: 'Thứ 5', dayIndex: 4, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: 'Thứ 6', dayIndex: 5, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: 'Thứ 7', dayIndex: 6, profit: 0, revenue: 0, cost: 0, shipping: 0 },
      { label: 'Chủ Nhật', dayIndex: 0, profit: 0, revenue: 0, cost: 0, shipping: 0 },
    ];

    for (const order of activeOrders) {
      const d = order.orderDate ? new Date(order.orderDate) : new Date((order as any).createdAt || now);
      const day = d.getDay();
      const slot = days.find((item) => item.dayIndex === day);
      if (slot) {
        const rev = order.totalAmount || 0;
        const ship = order.shippingFee || 0;
        const cost = order.costPrice || 0;
        slot.revenue += rev;
        slot.shipping += ship;
        slot.cost += cost;
        slot.profit += rev - ship - cost;
      }
    }

    return days.map((d) => ({
      label: d.label,
      revenue: d.revenue,
      cost: d.cost,
      shipping: d.shipping,
      profit: d.profit,
    }));
  }

  if (period === 'month') {
    // Các ngày trong tháng (từ ngày 1 đến ngày cuối tháng)
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      label: `N${i + 1}`,
      dayNumber: i + 1,
      profit: 0,
      revenue: 0,
      cost: 0,
      shipping: 0,
    }));

    for (const order of activeOrders) {
      const d = order.orderDate ? new Date(order.orderDate) : new Date((order as any).createdAt || now);
      const dayNum = d.getDate();
      const slot = monthDays.find((s) => s.dayNumber === dayNum);
      if (slot) {
        const rev = order.totalAmount || 0;
        const ship = order.shippingFee || 0;
        const cost = order.costPrice || 0;
        slot.revenue += rev;
        slot.shipping += ship;
        slot.cost += cost;
        slot.profit += rev - ship - cost;
      }
    }

    return monthDays.map((d) => ({
      label: d.label,
      revenue: d.revenue,
      cost: d.cost,
      shipping: d.shipping,
      profit: d.profit,
    }));
  }

  if (period === 'year') {
    // 12 tháng trong năm: Tháng 1 -> Tháng 12
    const months = Array.from({ length: 12 }, (_, i) => ({
      label: `Tháng ${i + 1}`,
      monthIndex: i,
      profit: 0,
      revenue: 0,
      cost: 0,
      shipping: 0,
    }));

    for (const order of activeOrders) {
      const d = order.orderDate ? new Date(order.orderDate) : new Date((order as any).createdAt || now);
      const m = d.getMonth();
      const slot = months.find((s) => s.monthIndex === m);
      if (slot) {
        const rev = order.totalAmount || 0;
        const ship = order.shippingFee || 0;
        const cost = order.costPrice || 0;
        slot.revenue += rev;
        slot.shipping += ship;
        slot.cost += cost;
        slot.profit += rev - ship - cost;
      }
    }

    return months.map((m) => ({
      label: m.label,
      revenue: m.revenue,
      cost: m.cost,
      shipping: m.shipping,
      profit: m.profit,
    }));
  }

  // Mặc định (all / custom): 6 tháng gần nhất
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      label: `T${d.getMonth() + 1}/${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth(),
      profit: 0,
      revenue: 0,
      cost: 0,
      shipping: 0,
    };
  });

  for (const order of activeOrders) {
    const d = order.orderDate ? new Date(order.orderDate) : new Date((order as any).createdAt || now);
    const y = d.getFullYear();
    const m = d.getMonth();
    const slot = last6Months.find((s) => s.year === y && s.month === m);
    if (slot) {
      const rev = order.totalAmount || 0;
      const ship = order.shippingFee || 0;
      const cost = order.costPrice || 0;
      slot.revenue += rev;
      slot.shipping += ship;
      slot.cost += cost;
      slot.profit += rev - ship - cost;
    }
  }

  return last6Months.map((m) => ({
    label: m.label,
    revenue: m.revenue,
    cost: m.cost,
    shipping: m.shipping,
    profit: m.profit,
  }));
}

import { AppCacheService } from '../../common/cache/app-cache.service';

@Injectable()
export class OrdersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly cacheService: AppCacheService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Tự động quét và giải phóng các ảnh Base64 cũ lưu trong DB sang file tĩnh WebP
   */
  async onApplicationBootstrap() {
    try {
      const ordersWithBase64 = await this.orderModel
        .find({ imageUrl: { $regex: /^data:image\// } })
        .limit(100)
        .exec();

      if (ordersWithBase64.length > 0) {
        this.logger.log(`🔄 Phát hiện ${ordersWithBase64.length} đơn hàng chứa ảnh Base64 cũ, bắt đầu tối ưu hóa...`);
        let convertedCount = 0;
        for (const order of ordersWithBase64) {
          try {
            if (order.imageUrl && order.imageUrl.startsWith('data:image/')) {
              const staticUrl = this.uploadService.saveBase64(order.imageUrl);
              order.imageUrl = staticUrl;
              await order.save();
              convertedCount++;
            }
          } catch (e) {
            this.logger.warn(`Không thể chuyển đổi ảnh cho đơn ${order.orderCode}: ${e.message}`);
          }
        }
        this.logger.log(`✅ Đã chuyển đổi thành công ${convertedCount} ảnh đơn hàng sang file tĩnh! Database đã được giải phóng.`);
      }
    } catch (err) {
      this.logger.warn(`Lỗi khi quét ảnh base64 cũ: ${err.message}`);
    }
  }

  /**
   * Chuẩn hóa URL ảnh: nếu là base64 thì lưu thành file tĩnh ngay
   */
  private normalizeImageUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('data:image/')) {
      try {
        return this.uploadService.saveBase64(url);
      } catch (err) {
        this.logger.warn(`Không thể lưu ảnh base64: ${err.message}`);
      }
    }
    return url;
  }

  async findAll(
    userId: string,
    query?: {
      search?: string;
      status?: string;
      period?: string;
      fromDate?: string;
      toDate?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const periodKey = query?.period || (query?.fromDate ? `${query.fromDate}_${query?.toDate}` : 'all');
    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Number(query.limit) : 0;
    const cacheKey = `orders:list:${userId}:${periodKey}:${page}:${limit}`;

    // Nếu không có search cụ thể, áp dụng cache nhanh 30s
    if (!query?.search && (!query?.status || query?.status === 'ALL')) {
      return this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const filter: any = { userId: new Types.ObjectId(userId) };
          const { startDate, endDate } = calculateDateRange(query?.period, query?.fromDate, query?.toDate);
          if (startDate || endDate) {
            filter.orderDate = {};
            if (startDate) filter.orderDate.$gte = startDate;
            if (endDate) filter.orderDate.$lte = endDate;
          }

          let mQuery = this.orderModel
            .find(filter)
            .sort({ orderDate: -1, createdAt: -1 })
            .lean();

          if (limit > 0) {
            mQuery = mQuery.skip((page - 1) * limit).limit(limit);
          }

          return mQuery.exec();
        },
        30,
      );
    }

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

    let mQuery = this.orderModel
      .find(filter)
      .sort({ orderDate: -1, createdAt: -1 })
      .lean();

    if (limit > 0) {
      mQuery = mQuery.skip((page - 1) * limit).limit(limit);
    }

    return mQuery.exec();
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
        const cnWarehouseCount = orders.filter((o) => o.status === OrderStatus.CN_WAREHOUSE).length;
        const vnWarehouseCount = orders.filter((o) => o.status === OrderStatus.VN_WAREHOUSE).length;
        const atHomeCount = orders.filter((o) => o.status === OrderStatus.AT_HOME).length;
        const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
        const cancelledOrders = orders.filter((o) => o.status === OrderStatus.CANCELLED).length;

        const inProgressCount = orderedCount + cnWarehouseCount + vnWarehouseCount + atHomeCount;
        const completionRate = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

        // Tính timeline lợi nhuận theo kỳ (hôm nay theo giờ, tuần theo ngày, tháng theo ngày, năm theo tháng)
        const timeline = buildProfitTimeline(orders, query?.period || 'all');

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
          cnWarehouseCount,
          vnWarehouseCount,
          atHomeCount,
          inProgressCount,
          completedOrders,
          cancelledOrders,
          completionRate,
          period: query?.period || 'all',
          timeline,
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
        address: c.address || '',
        quantity: c.quantity && Number(c.quantity) > 0 ? Number(c.quantity) : 1,
        amount,
        paidAmount,
        orderDate: c.orderDate ? new Date(c.orderDate) : new Date(),
        status: c.status || OrderStatus.ORDERED,
        paymentStatus,
        note: c.note || '',
        size: c.size || '',
        color: c.color || '',
        imageUrl: c.imageUrl ? this.normalizeImageUrl(c.imageUrl) : '',
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
    const imageUrl = dto.imageUrl ? this.normalizeImageUrl(dto.imageUrl) : dto.imageUrl;

    const newOrder = new this.orderModel({
      ...dto,
      imageUrl,
      userId: new Types.ObjectId(userId),
      orderCode,
      size: dto.size || primaryCust?.size || '',
      color: dto.color || primaryCust?.color || '',
      customers,
      totalAmount,
      paidAmount,
      costPrice: dto.costPrice || 0,
      shippingFee: dto.shippingFee || 0,
      paymentStatus: orderPaymentStatus,
      customerName: primaryCust?.name || dto.customerName || '',
      customerPhone: primaryCust?.phone || dto.customerPhone || '',
      customerAddress: primaryCust?.address || dto.customerAddress || dto.address || '',
      address: primaryCust?.address || dto.customerAddress || dto.address || '',
      customerFacebookUrl: primaryCust?.facebookUrl || dto.customerFacebookUrl || dto.facebookUrl || '',
      facebookUrl: primaryCust?.facebookUrl || dto.customerFacebookUrl || dto.facebookUrl || '',
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
    if (dto.imageUrl !== undefined) {
      updateData.imageUrl = this.normalizeImageUrl(dto.imageUrl);
    }

    if (dto.size !== undefined) updateData.size = dto.size;
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
          quantity: c.quantity && Number(c.quantity) > 0 ? Number(c.quantity) : 1,
          amount,
          paidAmount,
          orderDate: c.orderDate ? new Date(c.orderDate) : new Date(),
          status: c.status || OrderStatus.ORDERED,
          paymentStatus,
          note: c.note || '',
          size: c.size || '',
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
