import { api } from '@/shared/lib/api';
import { Wallet } from '../wallet/walletApi';
import { Category } from '../category/categoryApi';

export interface Transaction {
  _id: string;
  walletId: Wallet;
  toWalletId?: Wallet;
  categoryId?: Category;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  note?: string;
  tags?: string[];
}

export interface TransactionFilter {
  walletId?: string;
  categoryId?: string;
  type?: 'income' | 'expense' | 'transfer';
  search?: string;
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
}

export const transactionApi = {
  getAll: async (filter?: TransactionFilter): Promise<Transaction[]> => {
    const res = await api.get('/transactions', { params: filter });
    return res.data;
  },
  create: async (data: {
    walletId: string;
    toWalletId?: string;
    categoryId?: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
    date?: string;
    note?: string;
    tags?: string[];
  }): Promise<Transaction> => {
    const res = await api.post('/transactions', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
};
