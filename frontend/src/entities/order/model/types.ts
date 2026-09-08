export type OrderStatusType =
  | 'ORDERED'
  | 'CN_WAREHOUSE'
  | 'VN_WAREHOUSE'
  | 'AT_HOME'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatusType = 'UNPAID' | 'PAID' | 'PARTIAL';

export interface OrderCustomer {
  name: string;
  phone?: string;
  facebookUrl?: string; // Link Facebook của khách hàng
  quantity?: number; // Số lượng đặt
  amount?: number; // Tổng tiền khách này cần trả
  paidAmount?: number; // Tiền khách này đã thanh toán
  orderDate?: string; // Ngày lên đơn
  status?: OrderStatusType; // Trạng thái: Đã đặt → Kho Trung → Kho Việt → Nhà → Thành công → Đã hủy
  paymentStatus?: PaymentStatusType; // Thanh toán
  note?: string; // Ghi chú
}

export interface Order {
  _id: string;
  userId: string;
  orderCode: string;
  title: string;
  imageUrl?: string;
  customers: OrderCustomer[];
  totalAmount: number; // Tổng tiền cả đơn (= ∑ amount)
  paidAmount: number; // Tổng tiền đã thanh toán (= ∑ paidAmount)
  costPrice?: number; // Tiền vốn hàng hóa
  shippingFee?: number; // Phí vận chuyển / ship
  orderDate: string;
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;       // Tổng doanh thu
  totalShippingFee: number;   // Phí vận chuyển
  totalCostPrice: number;     // Tiền vốn
  netRevenue: number;         // Doanh thu thuần = Tổng doanh thu - Phí ship
  profit: number;             // Lợi nhuận = Doanh thu - Phí ship - Tiền vốn
  profitMargin: number;       // Tỷ suất lợi nhuận (%)
  totalPaid: number;          // Thực thu đã thanh toán
  totalRemaining: number;     // Công nợ còn lại
  orderedCount: number;
  cnWarehouseCount: number;
  vnWarehouseCount: number;
  atHomeCount: number;
  inProgressCount: number;
  completedOrders: number;
  cancelledOrders: number;
  completionRate: number;
  period?: string;
  timeline?: {
    label: string;
    revenue: number;
    cost: number;
    shipping: number;
    profit: number;
  }[];
}

export interface CreateOrderPayload {
  orderCode?: string;
  title: string;
  imageUrl?: string;
  customers?: OrderCustomer[];
  totalAmount?: number;
  paidAmount?: number;
  costPrice?: number;
  shippingFee?: number;
  orderDate?: string;
  status?: OrderStatusType;
  paymentStatus?: PaymentStatusType;
  note?: string;
}

export interface UpdateOrderPayload extends Partial<CreateOrderPayload> {}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatusType,
  { label: string; color: string; bg: string; text: string; border: string; step: number }
> = {
  ORDERED: {
    label: 'Đã đặt',
    color: '#3B82F6',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-500/20',
    step: 1,
  },
  CN_WAREHOUSE: {
    label: 'Kho Trung',
    color: '#06B6D4',
    bg: 'bg-cyan-50 dark:bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-500/20',
    step: 2,
  },
  VN_WAREHOUSE: {
    label: 'Kho Việt',
    color: '#F97316',
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-500/20',
    step: 3,
  },
  AT_HOME: {
    label: 'Nhà',
    color: '#8B5CF6',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-500/20',
    step: 4,
  },
  COMPLETED: {
    label: 'Thành công',
    color: '#10B981',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    step: 5,
  },
  CANCELLED: {
    label: 'Đã hủy',
    color: '#EF4444',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/20',
    step: 0,
  },
};
