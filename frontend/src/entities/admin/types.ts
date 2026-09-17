export type AdminRoleType = 'PERSONAL' | 'SALES' | 'ADMIN';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  currency?: string;
  language?: string;
  role: AdminRoleType;
  isActive: boolean;
  subscriptionMonths?: number | null;
  monthlyPrice?: number;
  totalAmountPaid?: number;
  subscriptionStartDate?: string | null;
  subscriptionExpiresAt?: string | null;
  daysRemaining?: number | null;
  isExpired?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  users: {
    total: number;
    personal: number;
    sales: number;
    admin: number;
    active: number;
    blocked: number;
    newLast30Days: number;
  };
  finance: {
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
  };
  sales: {
    totalOrders: number;
    totalRevenue: number;
    totalProfit: number;
  };
  recentUsers: Array<{
    _id: string;
    email: string;
    fullName: string;
    role: AdminRoleType;
    isActive?: boolean;
    createdAt: string;
  }>;
}

export interface AdminUserFilter {
  search?: string;
  role?: AdminRoleType;
  status?: 'active' | 'blocked' | 'all';
}

export interface CreateAdminUserData {
  email: string;
  password: string;
  fullName: string;
  role?: AdminRoleType;
  subscriptionMonths?: number;
  monthlyPrice?: number;
  subscriptionStartDate?: string;
}

export interface UpdateAdminUserData {
  email?: string;
  password?: string;
  fullName?: string;
  role?: AdminRoleType;
  isActive?: boolean;
  subscriptionMonths?: number;
  monthlyPrice?: number;
  subscriptionExpiresAt?: string;
}

export interface RenewSubscriptionData {
  months: number;
  monthlyPrice?: number;
}

export interface UserCustomerItem {
  id: string;
  name: string;
  phone: string;
  group: string;
  totalSpent: number;
  totalOrders: number;
  debtAmount: number;
  lastOrderDate: string | null;
  note: string;
  address: string;
  facebookUrl: string;
  zaloPhone: string;
  createdAt: string;
}

export interface UserOrderItem {
  id: string;
  orderCode: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  costPrice: number;
  shippingFee: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customersCount: number;
}

export interface UserTransactionItem {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  date: string;
  note: string;
  tags: string[];
}

export interface AdminUserDetail {
  user: AdminUser & {
    hiddenMenus?: string[];
    isForever?: boolean;
  };
  customers: {
    total: number;
    totalDebt: number;
    totalSpent: number;
    list: UserCustomerItem[];
  };
  revenue: {
    sales: {
      totalOrders: number;
      totalSalesRevenue: number;
      totalPaidRevenue: number;
      totalCost: number;
      totalShipping: number;
      totalProfit: number;
      recentOrders: UserOrderItem[];
    };
    personal: {
      totalTransactions: number;
      totalIncome: number;
      totalExpense: number;
      balance: number;
      recentTransactions: UserTransactionItem[];
    };
  };
}
