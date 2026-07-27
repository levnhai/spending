import { api } from '@/shared/lib/api';

export type DebtType = 'BORROWED' | 'LENT';
export type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface PaymentRecord {
  amount: number;
  date: string;
  walletId?: string;
  note?: string;
}

export interface Debt {
  _id: string;
  personName: string;
  phone?: string;
  type: DebtType;
  amount: number;
  paidAmount: number;
  startDate: string;
  dueDate?: string;
  walletId?: {
    _id: string;
    name: string;
    type: string;
    color: string;
    icon: string;
  } | string;
  status: DebtStatus;
  notes?: string;
  payments: PaymentRecord[];
  createdAt?: string;
}

export interface CreateDebtInput {
  personName: string;
  phone?: string;
  type: DebtType;
  amount: number;
  startDate?: string;
  dueDate?: string;
  walletId?: string;
  notes?: string;
}

export interface RecordPaymentInput {
  amount: number;
  date?: string;
  walletId?: string;
  note?: string;
}

export const debtApi = {
  getAll: async (): Promise<Debt[]> => {
    const res = await api.get('/debts');
    return res.data;
  },
  getById: async (id: string): Promise<Debt> => {
    const res = await api.get(`/debts/${id}`);
    return res.data;
  },
  create: async (data: CreateDebtInput): Promise<Debt> => {
    const res = await api.post('/debts', data);
    return res.data;
  },
  recordPayment: async (id: string, data: RecordPaymentInput): Promise<Debt> => {
    const res = await api.post(`/debts/${id}/pay`, data);
    return res.data;
  },
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete(`/debts/${id}`);
    return res.data;
  },
};
