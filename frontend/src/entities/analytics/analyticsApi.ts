import { api } from '@/shared/lib/api';

export interface DashboardSummary {
  totalBalance: number;
  totalSavings?: number;
  monthlyIncome: number;
  monthlyExpense: number;
  todayIncome: number;
  todayExpense: number;
  totalTransactions: number;
  netMonthly: number;
}

export interface PieChartItem {
  _id: string;
  name: string;
  color: string;
  icon: string;
  value: number;
}

export interface BarChartItem {
  month: string;
  income: number;
  expense: number;
}

export interface LineChartItem {
  day: string;
  amount: number;
}

export interface TopCategoryItem extends PieChartItem {
  percentage: number;
}

export interface WeeklyChartItem {
  day: string;
  fullDate: string;
  income: number;
  expense: number;
}

export const analyticsApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  },
  getPieChart: async (month?: number, year?: number): Promise<PieChartItem[]> => {
    const res = await api.get('/analytics/pie-chart', { params: { month, year } });
    return res.data;
  },
  getBarChart: async (year?: number): Promise<BarChartItem[]> => {
    const res = await api.get('/analytics/bar-chart', { params: { year } });
    return res.data;
  },
  getWeeklyChart: async (): Promise<WeeklyChartItem[]> => {
    const res = await api.get('/analytics/weekly-chart');
    return res.data;
  },
  getLineChart: async (month?: number, year?: number): Promise<LineChartItem[]> => {
    const res = await api.get('/analytics/line-chart', { params: { month, year } });
    return res.data;
  },
  getTopCategories: async (month?: number, year?: number): Promise<TopCategoryItem[]> => {
    const res = await api.get('/analytics/top-categories', { params: { month, year } });
    return res.data;
  },
};
