import { api } from '@/shared/lib/api';
import {
  Customer,
  CustomerStats,
  CustomerWithOrders,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from '../model/types';

export const customerApi = {
  getAll: async (params?: {
    search?: string;
    group?: string;
    hasDebt?: string;
    sortBy?: string;
  }): Promise<Customer[]> => {
    const res = await api.get('/customers', { params });
    return res.data;
  },

  getStats: async (): Promise<CustomerStats> => {
    const res = await api.get('/customers/stats');
    return res.data;
  },

  getById: async (id: string): Promise<CustomerWithOrders> => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },

  create: async (payload: CreateCustomerPayload): Promise<Customer> => {
    const res = await api.post('/customers', payload);
    return res.data;
  },

  update: async (id: string, payload: UpdateCustomerPayload): Promise<Customer> => {
    const res = await api.put(`/customers/${id}`, payload);
    return res.data;
  },

  syncStats: async (id: string): Promise<Customer> => {
    const res = await api.post(`/customers/${id}/sync-stats`);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
  },
};
