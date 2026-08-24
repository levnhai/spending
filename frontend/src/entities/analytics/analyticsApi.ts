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
  income?: number;
  expense?: number;
}

export interface TopCategoryItem extends PieChartItem {
  percentage: number;
}

export interface WeeklyChartItem {
  day: string;
  fullDate: string;
  income: number;
  expense: number;
  isToday?: boolean;
}

export interface CategoryComparisonItem {
  name: string;
  color: string;
  icon: string;
  val1: number;
  val2: number;
  diff: number;
  diffPercent?: number;
}

export interface MonthComparisonResult {
  month1: { month: number; year: number; income: number; expense: number; net: number; categories: PieChartItem[] };
  month2: { month: number; year: number; income: number; expense: number; net: number; categories: PieChartItem[] };
  diff: {
    incomeDiff: number;
    expenseDiff: number;
    netDiff: number;
    incomePercent: number;
    expensePercent: number;
  };
  categoryComparison: CategoryComparisonItem[];
}

export interface DayComparisonResult {
  day1: { date: string; income: number; expense: number; net: number; txCount: number };
  day2: { date: string; income: number; expense: number; net: number; txCount: number };
  diff: {
    incomeDiff: number;
    expenseDiff: number;
    netDiff: number;
  };
  categoryComparison: CategoryComparisonItem[];
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
  getIncomePieChart: async (month?: number, year?: number): Promise<PieChartItem[]> => {
    const res = await api.get('/analytics/income-pie-chart', { params: { month, year } });
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
  compareMonths: async (m1: number, y1: number, m2: number, y2: number): Promise<MonthComparisonResult> => {
    const res = await api.get('/analytics/compare-months', { params: { m1, y1, m2, y2 } });
    return res.data;
  },
  compareDays: async (date1: string, date2: string): Promise<DayComparisonResult> => {
    const res = await api.get('/analytics/compare-days', { params: { date1, date2 } });
    return res.data;
  },
};
