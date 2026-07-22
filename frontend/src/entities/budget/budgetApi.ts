import { api } from '@/shared/lib/api';
import { Category } from '../category/categoryApi';

export interface Budget {
  _id: string;
  categoryId: Category;
  limitAmount: number;
  spentAmount: number;
  remaining: number;
  percentage: number;
  month: number;
  year: number;
  isExceeded: boolean;
  isWarning: boolean;
}

export const budgetApi = {
  getAll: async (month?: number, year?: number): Promise<Budget[]> => {
    const res = await api.get('/budgets', { params: { month, year } });
    return res.data;
  },
  create: async (data: { categoryId: string; limitAmount: number; month: number; year: number }): Promise<Budget> => {
    const res = await api.post('/budgets', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/budgets/${id}`);
    return res.data;
  },
};
