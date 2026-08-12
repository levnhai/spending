import { api } from '@/shared/lib/api';

export interface FixedExpenseItem {
  name: string;
  amount: number;
  billId?: string;
}

export interface DebtRepaymentItem {
  name: string;
  amount: number;
  debtId?: string;
}

export interface SavingsTargetItem {
  name: string;
  amount: number;
  goalId?: string;
}

export interface CategoryLimitItem {
  categoryId: {
    _id: string;
    name: string;
    icon: string;
    color: string;
    type: string;
  } | string;
  amount: number;
}

export interface MonthlyPlan {
  _id?: string;
  month: number;
  year: number;
  expectedIncome: number;
  fixedExpenses: FixedExpenseItem[];
  debtRepayments: DebtRepaymentItem[];
  savingsTargets: SavingsTargetItem[];
  categoryLimits: CategoryLimitItem[];
  notes?: string;
}

export interface PlanSummaryData {
  hasPlan: boolean;
  plan?: MonthlyPlan;
  month: number;
  year: number;
  totalDays?: number;
  currentDay?: number;
  actualIncome?: number;
  actualExpense?: number;
  summary?: {
    expectedIncome: number;
    totalFixed: number;
    totalDebt: number;
    totalSavings: number;
    discretionaryBudget: number;
    dailyAllowance: number;
    weeklyAllowance: number;
    actualIncome: number;
    actualExpense: number;
    remainingDiscretionary: number;
    daysPassedPercentage: number;
    spentPercentage: number;
    isOverPace: boolean;
    remainingDays?: number;
    adjustedDailyAllowance?: number;
  };
}

export interface PlanSuggestions {
  suggestedBills: Array<{ billId: string; name: string; amount: number }>;
  suggestedDebts: Array<{ debtId: string; name: string; amount: number }>;
  suggestedSavings: Array<{ goalId: string; name: string; amount: number }>;
}

export const monthlyPlanApi = {
  getPlan: async (month?: number, year?: number): Promise<PlanSummaryData> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const res = await api.get(`/monthly-plans/current?${params.toString()}`);
    return res.data;
  },
  getSuggestions: async (): Promise<PlanSuggestions> => {
    const res = await api.get('/monthly-plans/suggestions');
    return res.data;
  },
  savePlan: async (planData: MonthlyPlan): Promise<MonthlyPlan> => {
    const res = await api.post('/monthly-plans', planData);
    return res.data;
  },
  deletePlan: async (month: number, year: number) => {
    const res = await api.delete(`/monthly-plans?month=${month}&year=${year}`);
    return res.data;
  },
};
