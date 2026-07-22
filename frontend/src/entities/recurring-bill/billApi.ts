import { api } from '@/shared/lib/api';
import { Wallet } from '../wallet/walletApi';
import { Category } from '../category/categoryApi';

export interface RecurringBill {
  _id: string;
  walletId: Wallet;
  categoryId: Category;
  title: string;
  amount: number;
  dueDate: number;
  isActive: boolean;
}

export const billApi = {
  getAll: async (): Promise<RecurringBill[]> => {
    const res = await api.get('/recurring-bills');
    return res.data;
  },
  create: async (data: {
    walletId: string;
    categoryId: string;
    title: string;
    amount: number;
    dueDate: number;
  }): Promise<RecurringBill> => {
    const res = await api.post('/recurring-bills', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/recurring-bills/${id}`);
    return res.data;
  },
};
