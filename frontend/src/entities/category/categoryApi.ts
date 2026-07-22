import { api } from '@/shared/lib/api';

export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isSystem?: boolean;
}

export const categoryApi = {
  getAll: async (type?: 'income' | 'expense'): Promise<Category[]> => {
    const res = await api.get('/categories', { params: { type } });
    return res.data;
  },
  create: async (data: { name: string; type: 'income' | 'expense'; icon?: string; color?: string }): Promise<Category> => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};
