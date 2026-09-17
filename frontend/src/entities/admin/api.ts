import { api } from '@/shared/lib/api';
import {
  AdminStats,
  AdminUser,
  AdminUserFilter,
  CreateAdminUserData,
  UpdateAdminUserData,
  RenewSubscriptionData,
  AdminRoleType,
  AdminUserDetail,
} from './types';

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get('/admin/stats');
    return res.data;
  },

  getUsers: async (filter?: AdminUserFilter): Promise<AdminUser[]> => {
    const res = await api.get('/admin/users', {
      params: filter,
    });
    return res.data;
  },

  getUserDetail: async (userId: string): Promise<AdminUserDetail> => {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data;
  },

  updateUser: async (
    userId: string,
    data: UpdateAdminUserData,
  ): Promise<AdminUser & { message: string }> => {
    const res = await api.patch(`/admin/users/${userId}`, data);
    return res.data;
  },

  renewSubscription: async (
    userId: string,
    data: RenewSubscriptionData,
  ): Promise<AdminUser & { message: string }> => {
    const res = await api.post(`/admin/users/${userId}/renew`, data);
    return res.data;
  },

  updateRole: async (userId: string, role: AdminRoleType): Promise<{ message: string; role: AdminRoleType }> => {
    const res = await api.patch(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  updateStatus: async (userId: string, isActive: boolean): Promise<{ message: string; isActive: boolean }> => {
    const res = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return res.data;
  },

  createUser: async (data: CreateAdminUserData): Promise<AdminUser & { message: string }> => {
    const res = await api.post('/admin/users', data);
    return res.data;
  },

  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  },
};
