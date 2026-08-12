import { api } from '@/shared/lib/api';

export interface Wallet {
  _id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'credit' | 'savings';
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  isDefault?: boolean;
  isExcludedFromTotal?: boolean;
  savingsGoalId?: string;
}

export const walletApi = {
  getAll: async (): Promise<Wallet[]> => {
    const res = await api.get('/wallets');
    return res.data;
  },
  create: async (data: { name: string; type: string; initialBalance: number; color?: string; icon?: string }): Promise<Wallet> => {
    const res = await api.post('/wallets', data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/wallets/${id}`);
    return res.data;
  },
};
