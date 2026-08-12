import { api } from '@/shared/lib/api';

export interface SavingsGoal {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  deadline?: string;
  icon?: string;
  color?: string;
  isCompleted: boolean;
  walletId?: string;
}

export const goalApi = {
  getAll: async (): Promise<SavingsGoal[]> => {
    const res = await api.get('/savings-goals');
    return res.data;
  },
  create: async (data: {
    title: string;
    targetAmount: number;
    currentAmount?: number;
    deadline?: string;
    icon?: string;
    color?: string;
  }): Promise<SavingsGoal> => {
    const res = await api.post('/savings-goals', data);
    return res.data;
  },
  deposit: async (
    id: string,
    payload: number | { amount: number; walletId?: string; type?: 'deposit' | 'withdraw'; note?: string },
  ): Promise<SavingsGoal> => {
    const body = typeof payload === 'number' ? { amount: payload } : payload;
    const res = await api.put(`/savings-goals/${id}/deposit`, body);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/savings-goals/${id}`);
    return res.data;
  },
};
