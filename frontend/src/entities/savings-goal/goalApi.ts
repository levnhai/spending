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
  deposit: async (id: string, amount: number): Promise<SavingsGoal> => {
    const res = await api.put(`/savings-goals/${id}/deposit`, { amount });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/savings-goals/${id}`);
    return res.data;
  },
};
