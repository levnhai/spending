import { api } from '@/shared/lib/api';
import {
  Order,
  OrderStats,
  CreateOrderPayload,
  UpdateOrderPayload,
  OrderStatusType,
} from '../model/types';

export const orderApi = {
  getAll: async (params?: {
    search?: string;
    status?: string;
    period?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<Order[]> => {
    const res = await api.get('/orders', { params });
    return res.data;
  },

  getStats: async (params?: {
    period?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<OrderStats> => {
    const res = await api.get('/orders/stats', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Order> => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },

  create: async (payload: CreateOrderPayload): Promise<Order> => {
    const res = await api.post('/orders', payload);
    return res.data;
  },

  update: async (id: string, payload: UpdateOrderPayload): Promise<Order> => {
    const res = await api.put(`/orders/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id: string, status: OrderStatusType): Promise<Order> => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/orders/${id}`);
    return res.data;
  },
};
