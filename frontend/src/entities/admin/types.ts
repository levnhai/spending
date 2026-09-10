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
}
