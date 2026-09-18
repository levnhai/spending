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
import { Customer, CustomerDocument } from '../../schemas/customer.schema';

@Injectable()
export class OrdersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    private readonly cacheService: AppCacheService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Tự động quét và đồng bộ các ảnh Base64 hoặc ảnh local cũ trong DB sang Cloudinary
   */
  async onApplicationBootstrap() {
    try {
      const isCloudReady = this.uploadService.isCloudinaryReady();

      // 1. Quét và đồng bộ các ảnh Base64 (cả root và customers)
      const ordersWithBase64 = await this.orderModel
        .find({
          $or: [
            { imageUrl: { $regex: /^data:image\// } },
            { 'customers.imageUrl': { $regex: /^data:image\// } },
          ],
        })
        .limit(200)
        .exec();

      if (ordersWithBase64.length > 0) {
        this.logger.log(`🔄 Phát hiện ${ordersWithBase64.length} đơn hàng chứa ảnh Base64 cũ, bắt đầu tối ưu hóa...`);
        let convertedCount = 0;
        for (const order of ordersWithBase64) {
          try {
            let isModified = false;
            if (order.imageUrl && order.imageUrl.startsWith('data:image/')) {
              const newUrl = await this.uploadService.saveBase64(order.imageUrl);
              order.imageUrl = newUrl;
              isModified = true;
            }
            if (order.customers && order.customers.length > 0) {
              for (const cust of order.customers) {
                if (cust.imageUrl && cust.imageUrl.startsWith('data:image/')) {
                  cust.imageUrl = await this.uploadService.saveBase64(cust.imageUrl);
                  isModified = true;
                }
              }
            }
            if (isModified) {
              await order.save();
              convertedCount++;
            }
          } catch (e) {
            this.logger.warn(`Không thể chuyển đổi ảnh cho đơn ${order.orderCode}: ${e.message}`);
          }
        }
        this.logger.log(`✅ Đã chuyển đổi thành công ${convertedCount} ảnh đơn hàng Base64!`);
      }

      // 2. Nếu Cloudinary đã sẵn sàng, tự động migrate các file /uploads/orders/ cũ lên Cloudinary
      if (isCloudReady) {
        const ordersWithLocalFiles = await this.orderModel
          .find({
            $or: [
              { imageUrl: { $regex: /^\/uploads\/orders\// } },
              { 'customers.imageUrl': { $regex: /^\/uploads\/orders\// } },
            ],
          })
          .limit(200)
          .exec();

        if (ordersWithLocalFiles.length > 0) {
          this.logger.log(`☁️ Bắt đầu tải ${ordersWithLocalFiles.length} đơn hàng có ảnh local lên Cloudinary...`);
          let cloudMigratedCount = 0;
          for (const order of ordersWithLocalFiles) {
            try {
              let isModified = false;
              if (order.imageUrl && order.imageUrl.startsWith('/uploads/orders/')) {
                const cloudUrl = await this.uploadService.uploadLocalFileToCloudinary(order.imageUrl);
                if (cloudUrl) {
                  order.imageUrl = cloudUrl;
                  isModified = true;
                }
              }
              if (order.customers && order.customers.length > 0) {
                for (const cust of order.customers) {
                  if (cust.imageUrl && cust.imageUrl.startsWith('/uploads/orders/')) {
                    const cloudUrl = await this.uploadService.uploadLocalFileToCloudinary(cust.imageUrl);
                    if (cloudUrl) {
                      cust.imageUrl = cloudUrl;
                      isModified = true;
                    }
                  }
                }
              }
              if (isModified) {
                await order.save();
                cloudMigratedCount++;
              }
            } catch (e) {
              this.logger.warn(`Không thể tải ảnh đơn ${order.orderCode} lên Cloudinary: ${e.message}`);
            }
          }
          this.logger.log(`✅ Đã tải thành công ${cloudMigratedCount} đơn hàng có ảnh local lên Cloudinary!`);
        }
      }

      // 3. Tự động đồng bộ các đơn hàng đã THÀNH CÔNG (COMPLETED) -> coi như tiền đã thu đủ
      const completedOrders = await this.orderModel
        .find({
          $or: [
            { status: OrderStatus.COMPLETED },
            { 'customers.status': OrderStatus.COMPLETED },
          ],
        })
        .exec();

      if (completedOrders.length > 0) {
        const affectedCustomersMap = new Map<string, { userId: string; name?: string; phone?: string; facebookUrl?: string }>();
        let updatedCount = 0;

        for (const order of completedOrders) {
          let isModified = false;
          const isOrderCompleted = order.status === OrderStatus.COMPLETED;

          if (isOrderCompleted) {
            if (order.paidAmount !== order.totalAmount) {
              order.paidAmount = order.totalAmount || 0;
              isModified = true;
            }
            if (order.paymentStatus !== PaymentStatus.PAID) {
              order.paymentStatus = PaymentStatus.PAID;
              isModified = true;
            }
          }

          if (order.customers && order.customers.length > 0) {
            for (const cust of order.customers) {
              if (isOrderCompleted || cust.status === OrderStatus.COMPLETED) {
                if (cust.paidAmount !== cust.amount) {
                  cust.paidAmount = cust.amount || 0;
                  isModified = true;
                }
                if (cust.paymentStatus !== PaymentStatus.PAID) {
                  cust.paymentStatus = PaymentStatus.PAID;
                  isModified = true;
                }
                if (isOrderCompleted && cust.status !== OrderStatus.COMPLETED) {
                  cust.status = OrderStatus.COMPLETED;
                  isModified = true;
                }
              }
            }

            if (!isOrderCompleted) {
              const calcPaid = order.customers.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
              if (order.paidAmount !== calcPaid) {
                order.paidAmount = calcPaid;
                isModified = true;
              }
              if (order.paidAmount >= (order.totalAmount || 0) && (order.totalAmount || 0) > 0) {
                order.paymentStatus = PaymentStatus.PAID;
              }
            }
          }

          if (isModified) {
            await order.save();
            updatedCount++;
          }

          const uId = order.userId ? order.userId.toString() : '';
          if (uId) {
            if (order.customerName) {
              const key = `${uId}_${order.customerName}_${order.customerPhone || ''}`;
              affectedCustomersMap.set(key, { userId: uId, name: order.customerName, phone: order.customerPhone, facebookUrl: order.customerFacebookUrl });
            }
            (order.customers || []).forEach((c) => {
              if (c.name) {
                const key = `${uId}_${c.name}_${c.phone || ''}`;
                affectedCustomersMap.set(key, { userId: uId, name: c.name, phone: c.phone, facebookUrl: c.facebookUrl });
              }
            });
          }
        }

        const userGroupedCustomers = new Map<string, Array<{ name?: string; phone?: string; facebookUrl?: string }>>();
        for (const cust of affectedCustomersMap.values()) {
          const list = userGroupedCustomers.get(cust.userId) || [];
          list.push({ name: cust.name, phone: cust.phone, facebookUrl: cust.facebookUrl });
          userGroupedCustomers.set(cust.userId, list);
        }

        for (const [userId, custList] of userGroupedCustomers.entries()) {
          await this.syncCustomersFromOrderData(userId, custList);
        }

        if (updatedCount > 0) {
          this.logger.log(`✅ Đã cập nhật tiền thu đủ cho ${updatedCount} đơn hàng thành công và đồng bộ lại công nợ khách hàng!`);
        }
      }
    } catch (err) {
      this.logger.warn(`Lỗi khi quét đồng bộ khởi động: ${err.message}`);
    }
  }


  /**
   * Chuẩn hóa URL ảnh: upload lên Cloudinary nếu là base64 hoặc file local
   */
  private async normalizeImageUrl(url?: string): Promise<string> {
    if (!url) return '';
    if (url.startsWith('data:image/')) {
      try {
        return await this.uploadService.saveBase64(url);
      } catch (err) {
        this.logger.warn(`Không thể lưu ảnh base64: ${err.message}`);
      }
    } else if (url.startsWith('/uploads/orders/') && this.uploadService.isCloudinaryReady()) {
      try {
        const cloudUrl = await this.uploadService.uploadLocalFileToCloudinary(url);
        if (cloudUrl) return cloudUrl;
      } catch (err) {
        this.logger.warn(`Không thể chuyển đổi ảnh local sang Cloudinary: ${err.message}`);
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

  /**
   * Tự động tạo / cập nhật Customer và tính toán lại stats (doanh số, nợ, số đơn) khi có thay đổi đơn hàng
   */
  private async syncCustomersFromOrderData(
    userId: string,
    customerList: Array<{ name?: string; phone?: string; facebookUrl?: string; address?: string }>,
    isCreate = false,
  ) {
    try {
      const userObjId = new Types.ObjectId(userId);
      for (const item of customerList) {
        if (!item.name || !item.name.trim()) continue;

        const trimmedName = item.name.trim();
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nameRegex = new RegExp(`^${escapedName}$`, 'i');

        let customer = await this.customerModel.findOne({
          userId: userObjId,
          $or: [
            { name: nameRegex },
            ...(item.phone ? [{ phone: item.phone.trim() }] : []),
          ],
        });

        if (!customer && isCreate) {
          customer = new this.customerModel({
            userId: userObjId,
            name: trimmedName,
            phone: item.phone?.trim() || '',
            facebookUrl: item.facebookUrl?.trim() || '',
            address: item.address?.trim() || '',
            group: 'RETAIL',
            totalSpent: 0,
            debtAmount: 0,
            totalOrders: 0,
          });
          await customer.save();
        }

        if (customer) {
          // Tính lại stats cho customer này từ tất cả đơn hàng liên quan
          const custNameNorm = customer.name.toLowerCase().trim();
          const custPhoneNorm = customer.phone?.trim();
          const custFbNorm = customer.facebookUrl?.trim().toLowerCase();

          const relatedOrders = await this.orderModel.find({
            userId: userObjId,
            status: { $ne: OrderStatus.CANCELLED },
            $or: [
              { 'customers.name': nameRegex },
              { customerName: nameRegex },
              ...(customer.phone ? [{ 'customers.phone': customer.phone }, { customerPhone: customer.phone }] : []),
              ...(customer.facebookUrl ? [{ 'customers.facebookUrl': customer.facebookUrl }, { facebookUrl: customer.facebookUrl }] : []),
            ],
          });

          let totalSpent = 0;
          let paidAmount = 0;
          let debtAmount = 0;
          let totalOrders = 0;
          let latestOrderDate: Date | null = null;

          for (const ord of relatedOrders) {
            const ordDate = ord.orderDate ? new Date(ord.orderDate) : new Date((ord as any).createdAt || Date.now());
            if (!latestOrderDate || ordDate > latestOrderDate) {
              latestOrderDate = ordDate;
            }

            const matchedSub = (ord.customers || []).filter((c) => {
              const cn = c.name?.trim().toLowerCase();
              const cp = c.phone?.trim();
              const cf = c.facebookUrl?.trim().toLowerCase();
              return (
                (custNameNorm && cn === custNameNorm) ||
                (custPhoneNorm && cp && cp === custPhoneNorm) ||
                (custFbNorm && cf && cf === custFbNorm)
              );
            });

            if (matchedSub.length > 0) {
              let t = 0;
              let p = 0;
              for (const mc of matchedSub) {
                const isSubCompleted = mc.status === OrderStatus.COMPLETED || ord.status === OrderStatus.COMPLETED;
                const amt = mc.amount || 0;
                const paid = isSubCompleted ? amt : (mc.paidAmount || 0);
                t += amt;
                p += paid;
              }
              totalSpent += t;
              paidAmount += p;
              debtAmount += Math.max(0, t - p);
              totalOrders += 1;
            } else {
              const ordCustName = (ord.customerName || '').trim().toLowerCase();
              const ordCustPhone = (ord.customerPhone || '').trim();
              const isRoot =
                (custNameNorm && ordCustName === custNameNorm) ||
                (custPhoneNorm && ordCustPhone && ordCustPhone === custPhoneNorm);

              if (isRoot || (!ord.customers || ord.customers.length === 0)) {
                const isOrdCompleted = ord.status === OrderStatus.COMPLETED;
                const ot = ord.totalAmount || 0;
                const op = isOrdCompleted ? ot : (ord.paidAmount || 0);
                totalSpent += ot;
                paidAmount += op;
                debtAmount += Math.max(0, ot - op);
                totalOrders += 1;
              }
            }
          }

          customer.totalSpent = totalSpent;
          customer.debtAmount = debtAmount;
          customer.totalOrders = totalOrders;
          if (latestOrderDate) customer.lastOrderDate = latestOrderDate;
          if (item.address && !customer.address) customer.address = item.address;
          if (item.phone && !customer.phone) customer.phone = item.phone;
          if (item.facebookUrl && !customer.facebookUrl) customer.facebookUrl = item.facebookUrl;

          await customer.save();
        }
      }
    } catch (e: any) {
      this.logger.warn(`Lỗi khi tự động đồng bộ thống kê khách hàng: ${e.message}`);
    }
  }

  async create(userId: string, dto: CreateOrderDto) {
    const count = await this.orderModel.countDocuments({ userId: new Types.ObjectId(userId) });
    const orderCode =
      dto.orderCode && dto.orderCode.trim()
        ? dto.orderCode.trim()
        : `DH-${String(count + 1).padStart(4, '0')}`;

    const isOrderCompleted = dto.status === OrderStatus.COMPLETED;

    const customers = await Promise.all(
      (dto.customers || []).map(async (c) => {
        const isCustCompleted = isOrderCompleted || c.status === OrderStatus.COMPLETED;
        const amount = c.amount || 0;
        const paidAmount = isCustCompleted ? amount : (c.paidAmount || 0);
        let paymentStatus = isCustCompleted ? PaymentStatus.PAID : (c.paymentStatus || PaymentStatus.UNPAID);
        if (!isCustCompleted) {
          if (paidAmount >= amount && amount > 0) {
            paymentStatus = PaymentStatus.PAID;
          } else if (paidAmount > 0 && paidAmount < amount) {
            paymentStatus = PaymentStatus.PARTIAL;
          }
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
          status: isCustCompleted ? OrderStatus.COMPLETED : (c.status || OrderStatus.ORDERED),
          paymentStatus,
          note: c.note || '',
          size: c.size || '',
          color: c.color || '',
          imageUrl: c.imageUrl ? await this.normalizeImageUrl(c.imageUrl) : '',
        };
      }),
    );

    const calculatedTotal = customers.reduce((sum, c) => sum + (c.amount || 0), 0);
    const calculatedPaid = customers.reduce((sum, c) => sum + (c.paidAmount || 0), 0);

    const totalAmount = dto.totalAmount !== undefined && dto.totalAmount > 0 ? dto.totalAmount : calculatedTotal;
    const paidAmount = isOrderCompleted ? totalAmount : (dto.paidAmount !== undefined && dto.paidAmount > 0 ? dto.paidAmount : calculatedPaid);

    let orderPaymentStatus = isOrderCompleted ? PaymentStatus.PAID : PaymentStatus.UNPAID;
    if (!isOrderCompleted) {
      if (paidAmount >= totalAmount && totalAmount > 0) {
        orderPaymentStatus = PaymentStatus.PAID;
      } else if (paidAmount > 0) {
        orderPaymentStatus = PaymentStatus.PARTIAL;
      }
    }

    const primaryCust = customers[0];
    const imageUrl = dto.imageUrl ? await this.normalizeImageUrl(dto.imageUrl) : dto.imageUrl;

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

    // Tự động cập nhật khách hàng liên quan
    const targetCustomers = (customers.length > 0
      ? customers
      : [{ name: dto.customerName, phone: dto.customerPhone, facebookUrl: dto.customerFacebookUrl, address: dto.customerAddress }]
    ).filter((c) => c && c.name);

    await this.syncCustomersFromOrderData(userId, targetCustomers, true);

    return saved;
  }

  async update(id: string, userId: string, dto: UpdateOrderDto) {
    const existingOrder = await this.orderModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    const updateData: any = { ...dto };
    if (dto.imageUrl !== undefined) {
      updateData.imageUrl = await this.normalizeImageUrl(dto.imageUrl);
    }

    if (dto.size !== undefined) updateData.size = dto.size;
    if (dto.costPrice !== undefined) updateData.costPrice = dto.costPrice;
    if (dto.shippingFee !== undefined) updateData.shippingFee = dto.shippingFee;

    const isOrderCompleted = dto.status === OrderStatus.COMPLETED;

    if (dto.customers && dto.customers.length > 0) {
      updateData.customers = dto.customers.map((c, idx) => {
        const isCustCompleted = isOrderCompleted || c.status === OrderStatus.COMPLETED;
        const amount = c.amount || 0;
        const paidAmount = isCustCompleted ? amount : (c.paidAmount || 0);
        let paymentStatus = isCustCompleted ? PaymentStatus.PAID : (c.paymentStatus || PaymentStatus.UNPAID);
        if (!isCustCompleted) {
          if (paidAmount >= amount && amount > 0) {
            paymentStatus = PaymentStatus.PAID;
          } else if (paidAmount > 0 && paidAmount < amount) {
            paymentStatus = PaymentStatus.PARTIAL;
          }
        }

        const existingCust = (existingOrder?.customers || [])[idx] || (existingOrder?.customers || []).find((ec) => ec.name === c.name);
        const orderDate = c.orderDate
          ? new Date(c.orderDate)
          : (existingCust?.orderDate || existingOrder?.orderDate || new Date());

        return {
          name: c.name,
          phone: c.phone || '',
          facebookUrl: c.facebookUrl || '',
          quantity: c.quantity && Number(c.quantity) > 0 ? Number(c.quantity) : 1,
          amount,
          paidAmount,
          orderDate,
          status: isCustCompleted ? OrderStatus.COMPLETED : (c.status || OrderStatus.ORDERED),
          paymentStatus,
          note: c.note || '',
          size: c.size || '',
        };
      });

      const calculatedTotal = updateData.customers.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const calculatedPaid = updateData.customers.reduce((sum: number, c: any) => sum + (c.paidAmount || 0), 0);

      updateData.totalAmount = dto.totalAmount !== undefined && dto.totalAmount > 0 ? dto.totalAmount : calculatedTotal;
      updateData.paidAmount = isOrderCompleted ? updateData.totalAmount : (dto.paidAmount !== undefined && dto.paidAmount > 0 ? dto.paidAmount : calculatedPaid);

      if (isOrderCompleted || (updateData.paidAmount >= updateData.totalAmount && updateData.totalAmount > 0)) {
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
        updateData.orderDate = dto.orderDate
          ? new Date(dto.orderDate)
          : (primaryCust.orderDate || existingOrder?.orderDate);
        updateData.status = primaryCust.status;
      }
    } else {
      if (dto.orderDate) {
        updateData.orderDate = new Date(dto.orderDate);
      } else if (existingOrder?.orderDate) {
        updateData.orderDate = existingOrder.orderDate;
      }

      if (isOrderCompleted) {
        if (updateData.totalAmount !== undefined) {
          updateData.paidAmount = updateData.totalAmount;
        } else if (existingOrder) {
          updateData.paidAmount = existingOrder.totalAmount || 0;
        }
        updateData.paymentStatus = PaymentStatus.PAID;
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

    // Gom danh sách khách hàng cũ và mới để sync
    const combinedCustomers: Array<{ name?: string; phone?: string; facebookUrl?: string }> = [];
    if (existingOrder) {
      if (existingOrder.customerName) combinedCustomers.push({ name: existingOrder.customerName, phone: existingOrder.customerPhone, facebookUrl: existingOrder.customerFacebookUrl });
      (existingOrder.customers || []).forEach((c) => combinedCustomers.push({ name: c.name, phone: c.phone, facebookUrl: c.facebookUrl }));
    }
    if (updated) {
      if (updated.customerName) combinedCustomers.push({ name: updated.customerName, phone: updated.customerPhone, facebookUrl: updated.customerFacebookUrl });
      (updated.customers || []).forEach((c) => combinedCustomers.push({ name: c.name, phone: c.phone, facebookUrl: c.facebookUrl }));
    }

    await this.syncCustomersFromOrderData(userId, combinedCustomers);

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

    const isCompleted = status === OrderStatus.COMPLETED;

    const updatedCustomers = (order.customers || []).map((c: any) => ({
      name: c.name,
      phone: c.phone,
      facebookUrl: c.facebookUrl || '',
      amount: c.amount,
      paidAmount: isCompleted ? (c.amount || 0) : (c.paidAmount || 0),
      orderDate: c.orderDate || order.orderDate || (order as any).createdAt || new Date(),
      status,
      paymentStatus: isCompleted ? PaymentStatus.PAID : c.paymentStatus,
      note: c.note,
    }));

    order.status = status;
    order.customers = updatedCustomers as any;
    if (isCompleted) {
      order.paidAmount = order.totalAmount || 0;
      order.paymentStatus = PaymentStatus.PAID;
    }

    const saved = await order.save();
    await this.cacheService.invalidateUser(userId, ['orders', 'analytics']);

    const targetCustomers: Array<{ name?: string; phone?: string; facebookUrl?: string }> = [];
    if (order.customerName) targetCustomers.push({ name: order.customerName, phone: order.customerPhone, facebookUrl: order.customerFacebookUrl });
    (order.customers || []).forEach((c) => targetCustomers.push({ name: c.name, phone: c.phone, facebookUrl: c.facebookUrl }));
    await this.syncCustomersFromOrderData(userId, targetCustomers);

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

    const targetCustomers: Array<{ name?: string; phone?: string; facebookUrl?: string }> = [];
    if (deleted.customerName) targetCustomers.push({ name: deleted.customerName, phone: deleted.customerPhone, facebookUrl: deleted.customerFacebookUrl });
    (deleted.customers || []).forEach((c) => targetCustomers.push({ name: c.name, phone: c.phone, facebookUrl: c.facebookUrl }));
    await this.syncCustomersFromOrderData(userId, targetCustomers);

    return { message: 'Xóa đơn hàng thành công' };
  }
}
