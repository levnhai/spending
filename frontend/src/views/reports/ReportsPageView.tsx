'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';
import { formatVND } from '@/shared/lib/formatters';
import {
  analyticsApi,
  DashboardSummary,
  PieChartItem,
  LineChartItem,
  WeeklyChartItem,
  MonthComparisonResult,
  DayComparisonResult,
} from '@/entities/analytics/analyticsApi';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  Layers,
  PieChart as PieIcon,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const formatAxisVND = (v: number): string => {
  if (v === 0) return '0đ';
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return `${v}đ`;
};

const COLORS = ['#F43F5E', '#10B981', '#6366F1', '#F97316', '#EC4899', '#EAB308', '#06B6D4', '#8B5CF6'];

export const ReportsPageView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'compare-months' | 'compare-days'>('overview');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tab 1: Overview state
  const now = new Date();
  const [overviewMonth, setOverviewMonth] = useState<number>(now.getMonth() + 1);
  const [overviewYear, setOverviewYear] = useState<number>(now.getFullYear());
  const [expenseCategories, setExpenseCategories] = useState<PieChartItem[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<PieChartItem[]>([]);
  const [dailyTrend, setDailyTrend] = useState<LineChartItem[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyChartItem[]>([]);
  const [trendFilter, setTrendFilter] = useState<'month' | 'week'>('month');
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Tab 2: Compare Months state
  const [m1, setM1] = useState<number>(now.getMonth() === 0 ? 12 : now.getMonth());
  const [y1, setY1] = useState<number>(now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
  const [m2, setM2] = useState<number>(now.getMonth() + 1);
  const [y2, setY2] = useState<number>(now.getFullYear());
  const [monthCompareResult, setMonthCompareResult] = useState<MonthComparisonResult | null>(null);
  const [loadingMonthCompare, setLoadingMonthCompare] = useState(false);

  // Tab 3: Compare Days state
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const [date1, setDate1] = useState<string>(yesterday);
  const [date2, setDate2] = useState<string>(todayStr);
  const [dayCompareResult, setDayCompareResult] = useState<DayComparisonResult | null>(null);
  const [loadingDayCompare, setLoadingDayCompare] = useState(false);

  // Load Tab 1 Overview
  const fetchOverview = async () => {
    try {
      setLoadingOverview(true);
      const [expCats, incCats, trend, weekly] = await Promise.all([
        analyticsApi.getPieChart(overviewMonth, overviewYear),
        analyticsApi.getIncomePieChart(overviewMonth, overviewYear),
        analyticsApi.getLineChart(overviewMonth, overviewYear),
        analyticsApi.getWeeklyChart(),
      ]);
      setExpenseCategories(expCats);
      setIncomeCategories(incCats);
      setDailyTrend(trend);
      setWeeklyTrend(weekly);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
    }
  }, [activeTab, overviewMonth, overviewYear]);

  // Load Tab 2 Compare Months
  const fetchMonthComparison = async () => {
    try {
      setLoadingMonthCompare(true);
      const data = await analyticsApi.compareMonths(m1, y1, m2, y2);
      setMonthCompareResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMonthCompare(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compare-months') {
      fetchMonthComparison();
    }
  }, [activeTab, m1, y1, m2, y2]);

  // Load Tab 3 Compare Days
  const fetchDayComparison = async () => {
    if (!date1 || !date2) return;
    try {
      setLoadingDayCompare(true);
      const data = await analyticsApi.compareDays(date1, date2);
      setDayCompareResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDayCompare(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'compare-days') {
      fetchDayComparison();
    }
  }, [activeTab, date1, date2]);

  // Totals for Overview
  const totalOverviewExpense = expenseCategories.reduce((s, c) => s + c.value, 0);
  const totalOverviewIncome = incomeCategories.reduce((s, c) => s + c.value, 0);
  const totalOverviewNet = totalOverviewIncome - totalOverviewExpense;
  const savingsRate = totalOverviewIncome > 0 ? Math.round((totalOverviewNet / totalOverviewIncome) * 100) : 0;

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Báo Cáo & Phân Tích Tài Chính" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        {/* TOP TAB CONTROLS & HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
              Trung Tâm Báo Cáo & Thống Kê Trực Quan
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân tích doanh thu, chi tiêu, cơ cấu hạng mục và biểu đồ đối chiếu thông minh
            </p>
          </div>

          {/* Tab Selector Buttons */}
          <div className="flex items-center p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300/50 dark:border-slate-700/50 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <PieIcon className="w-4 h-4 text-emerald-500" />
              <span>Tổng Quan Tháng</span>
            </button>

            <button
              onClick={() => setActiveTab('compare-months')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'compare-months'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4 text-indigo-500" />
              <span>2 Tháng</span>
            </button>

            <button
              onClick={() => setActiveTab('compare-days')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'compare-days'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>2 Ngày</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* MONTH FILTER BAR */}
            <div className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Thống Kê Báo Cáo Tháng:</span>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={overviewMonth}
                  onChange={(e) => setOverviewMonth(Number(e.target.value))}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>

                <select
                  value={overviewYear}
                  onChange={(e) => setOverviewYear(Number(e.target.value))}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* OVERVIEW METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Income Card */}
              <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng Thu Nhập</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <AmountDisplay amount={totalOverviewIncome} className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] text-slate-400 block">Tháng {overviewMonth}/{overviewYear}</span>
              </div>

              {/* Expense Card */}
              <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng Chi Tiêu</span>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <AmountDisplay amount={totalOverviewExpense} className="text-2xl font-extrabold text-rose-600 dark:text-rose-400" />
                <span className="text-[11px] text-slate-400 block">Tháng {overviewMonth}/{overviewYear}</span>
              </div>

              {/* Net Surplus Card */}
              <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dư Lượng (Thu - Chi)</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                    <Scale className="w-4 h-4" />
                  </div>
                </div>
                <AmountDisplay
                  amount={totalOverviewNet}
                  className={`text-2xl font-extrabold ${totalOverviewNet >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500'}`}
                />
                <span className="text-[11px] text-slate-400 block">Tháng {overviewMonth}/{overviewYear}</span>
              </div>

              {/* Savings Rate Card */}
              <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tỷ Lệ Tích Lũy</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{savingsRate}%</div>
                <span className="text-[11px] text-slate-400 block">Dư lượng / Thu nhập</span>
              </div>
            </div>

            {/* VISUAL CHARTS SECTION (PIE CHARTS) */}
            {isMounted && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Pie Chart */}
                <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    Biểu Đồ Tròn Tỷ Lệ Chi Tiêu Theo Danh Mục
                  </h3>
                  <div className="h-72">
                    {expenseCategories.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Chưa có dữ liệu chi tiêu tháng này
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expenseCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {expenseCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Income Pie Chart */}
                <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    Biểu Đồ Tròn Tỷ Lệ Thu Nhập Theo Danh Mục
                  </h3>
                  <div className="h-72">
                    {incomeCategories.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                        Chưa có dữ liệu thu nhập tháng này
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={incomeCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {incomeCategories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* DAILY / WEEKLY INCOME & EXPENSE LINE TREND CHART */}
            {isMounted && (
              <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    {trendFilter === 'month'
                      ? `Biểu Đồ Biến Động Thu Nhập & Chi Tiêu Hàng Ngày (Tháng ${overviewMonth}/${overviewYear})`
                      : 'Biểu Đồ Biến Động Thu Nhập & Chi Tiêu Theo Tuần Hiện Tại'}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Lọc theo:</span>
                    <select
                      value={trendFilter}
                      onChange={(e) => setTrendFilter(e.target.value as 'month' | 'week')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="month">Tháng</option>
                      <option value="week">Tuần</option>
                    </select>
                  </div>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={
                        trendFilter === 'month'
                          ? dailyTrend
                          : weeklyTrend.map((w) => ({
                              day: `${w.day} (${w.fullDate})`,
                              income: w.income,
                              expense: w.expense,
                              amount: w.expense,
                            }))
                      }
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
                      <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10B981" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#F43F5E" strokeWidth={3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPARE 2 MONTHS */}
        {activeTab === 'compare-months' && (
          <div className="space-y-6 animate-fade-in">
            {/* MONTH COMPARISON CONTROLS */}
            <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-500" />
                Chọn 2 Tháng Cần Đối Chiếu So Sánh
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Month 1 */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                  <span className="text-xs font-extrabold text-indigo-500 uppercase tracking-wider block">THÁNG A (Gốc)</span>
                  <div className="flex items-center gap-3">
                    <select
                      value={m1}
                      onChange={(e) => setM1(Number(e.target.value))}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>

                    <select
                      value={y1}
                      onChange={(e) => setY1(Number(e.target.value))}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Month 2 */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <span className="text-xs font-extrabold text-amber-500 uppercase tracking-wider block">THÁNG B (So Sánh)</span>
                  <div className="flex items-center gap-3">
                    <select
                      value={m2}
                      onChange={(e) => setM2(Number(e.target.value))}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>Tháng {m}</option>
                      ))}
                    </select>

                    <select
                      value={y2}
                      onChange={(e) => setY2(Number(e.target.value))}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                    >
                      {[2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* MONTH COMPARISON RESULTS */}
            {monthCompareResult && (
              <div className="space-y-6">
                {/* SUMMARY COMPARISON CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Income comparison */}
                  <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Thu Nhập</span>
                    <div className="flex items-baseline justify-between">
                      <div className="text-xs text-slate-400">Tháng {m1}/{y1}: <AmountDisplay amount={monthCompareResult.month1.income} className="font-bold text-slate-700 dark:text-slate-300" /></div>
                      <div className="text-xs text-slate-400">Tháng {m2}/{y2}: <AmountDisplay amount={monthCompareResult.month2.income} className="font-bold text-emerald-500" /></div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Chênh lệch:</span>
                      <span className={`text-sm font-extrabold flex items-center gap-1 ${monthCompareResult.diff.incomeDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {monthCompareResult.diff.incomeDiff >= 0 ? '+' : ''}
                        <AmountDisplay amount={monthCompareResult.diff.incomeDiff} />
                      </span>
                    </div>
                  </div>

                  {/* Expense comparison */}
                  <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chi Tiêu</span>
                    <div className="flex items-baseline justify-between">
                      <div className="text-xs text-slate-400">Tháng {m1}/{y1}: <AmountDisplay amount={monthCompareResult.month1.expense} className="font-bold text-slate-700 dark:text-slate-300" /></div>
                      <div className="text-xs text-slate-400">Tháng {m2}/{y2}: <AmountDisplay amount={monthCompareResult.month2.expense} className="font-bold text-rose-500" /></div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Chênh lệch:</span>
                      <span className={`text-sm font-extrabold flex items-center gap-1 ${monthCompareResult.diff.expenseDiff <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {monthCompareResult.diff.expenseDiff >= 0 ? '+' : ''}
                        <AmountDisplay amount={monthCompareResult.diff.expenseDiff} />
                      </span>
                    </div>
                  </div>

                  {/* Net surplus comparison */}
                  <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Dư Lượng Thống Kê</span>
                    <div className="flex items-baseline justify-between">
                      <div className="text-xs text-slate-400">Tháng {m1}/{y1}: <AmountDisplay amount={monthCompareResult.month1.net} className="font-bold text-slate-700 dark:text-slate-300" /></div>
                      <div className="text-xs text-slate-400">Tháng {m2}/{y2}: <AmountDisplay amount={monthCompareResult.month2.net} className="font-bold text-indigo-500" /></div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Chênh lệch:</span>
                      <span className={`text-sm font-extrabold flex items-center gap-1 ${monthCompareResult.diff.netDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {monthCompareResult.diff.netDiff >= 0 ? '+' : ''}
                        <AmountDisplay amount={monthCompareResult.diff.netDiff} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* BAR CHART FOR MONTH COMPARISON */}
                {isMounted && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Overall Income vs Expense Bar Chart */}
                    <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        📊 Biểu Đồ So Sánh Tổng Thu vs Chi (Tháng {m1}/{y1} vs {m2}/{y2})
                      </h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: `Tháng ${m1}/${y1}`, income: monthCompareResult.month1.income, expense: monthCompareResult.month1.expense },
                              { name: `Tháng ${m2}/${y2}`, income: monthCompareResult.month2.income, expense: monthCompareResult.month2.expense },
                            ]}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
                            <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                            <Legend />
                            <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                            <Bar dataKey="expense" name="Chi tiêu" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Comparison Bar Chart */}
                    <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        📊 Biểu Đồ Chi Tiêu Theo Danh Mục (Tháng A vs Tháng B)
                      </h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={monthCompareResult.categoryComparison.slice(0, 6)}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
                            <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                            <Legend />
                            <Bar dataKey="val1" name={`Tháng ${m1}/${y1}`} fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            <Bar dataKey="val2" name={`Tháng ${m2}/${y2}`} fill="#F97316" radius={[4, 4, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* CATEGORY COMPARISON TABLE */}
                <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Đối Chiếu Chi Tiêu Chi Tiết Theo Danh Mục (Tháng {m1}/{y1} vs Tháng {m2}/{y2})
                  </h4>

                  {monthCompareResult.categoryComparison.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-6 text-center">Không có dữ liệu chi tiêu để so sánh giữa 2 tháng</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            <th className="py-3 px-4">Danh Mục</th>
                            <th className="py-3 px-4 text-right">Tháng {m1}/{y1}</th>
                            <th className="py-3 px-4 text-right">Tháng {m2}/{y2}</th>
                            <th className="py-3 px-4 text-right">Chênh Lệch (VNĐ)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                          {monthCompareResult.categoryComparison.map((cat, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                                <AmountDisplay amount={cat.val1} />
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                                <AmountDisplay amount={cat.val2} />
                              </td>
                              <td className="py-3 px-4 text-right font-extrabold">
                                <span className={`inline-flex items-center gap-1 ${cat.diff > 0 ? 'text-rose-500' : cat.diff < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {cat.diff > 0 ? '+' : ''}
                                  <AmountDisplay amount={cat.diff} />
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPARE 2 DAYS */}
        {activeTab === 'compare-days' && (
          <div className="space-y-6 animate-fade-in">
            {/* DATE COMPARISON CONTROLS */}
            <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Chọn 2 Ngày Cần Đối Chiếu So Sánh
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date 1 */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <label className="block text-xs font-extrabold text-amber-500 uppercase tracking-wider">NGÀY A</label>
                  <input
                    type="date"
                    value={date1}
                    onChange={(e) => setDate1(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                  />
                </div>

                {/* Date 2 */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                  <label className="block text-xs font-extrabold text-indigo-500 uppercase tracking-wider">NGÀY B</label>
                  <input
                    type="date"
                    value={date2}
                    onChange={(e) => setDate2(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* DAY COMPARISON RESULTS */}
            {dayCompareResult && (
              <div className="space-y-6">
                {/* SUMMARY COMPARISON CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Income comparison */}
                  <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Thu Nhập Theo Ngày</span>
                    <div className="flex items-baseline justify-between text-xs">
                      <div className="text-slate-400">Ngày {date1}: <AmountDisplay amount={dayCompareResult.day1.income} className="font-bold text-slate-700 dark:text-slate-300" /></div>
                      <div className="text-slate-400">Ngày {date2}: <AmountDisplay amount={dayCompareResult.day2.income} className="font-bold text-emerald-500" /></div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Chênh lệch:</span>
                      <span className={`text-sm font-extrabold ${dayCompareResult.diff.incomeDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {dayCompareResult.diff.incomeDiff >= 0 ? '+' : ''}
                        <AmountDisplay amount={dayCompareResult.diff.incomeDiff} />
                      </span>
                    </div>
                  </div>

                  {/* Expense comparison */}
                  <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Chi Tiêu Theo Ngày</span>
                    <div className="flex items-baseline justify-between text-xs">
                      <div className="text-slate-400">Ngày {date1}: <AmountDisplay amount={dayCompareResult.day1.expense} className="font-bold text-slate-700 dark:text-slate-300" /></div>
                      <div className="text-slate-400">Ngày {date2}: <AmountDisplay amount={dayCompareResult.day2.expense} className="font-bold text-rose-500" /></div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Chênh lệch:</span>
                      <span className={`text-sm font-extrabold ${dayCompareResult.diff.expenseDiff <= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {dayCompareResult.diff.expenseDiff >= 0 ? '+' : ''}
                        <AmountDisplay amount={dayCompareResult.diff.expenseDiff} />
                      </span>
                    </div>
                  </div>

                  {/* Transactions count comparison */}
                  <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Số Lượng Giao Dịch</span>
                    <div className="flex items-baseline justify-between text-xs">
                      <div className="text-slate-400">Ngày {date1}: <span className="font-bold text-slate-800 dark:text-slate-200">{dayCompareResult.day1.txCount} giao dịch</span></div>
                      <div className="text-slate-400">Ngày {date2}: <span className="font-bold text-indigo-500">{dayCompareResult.day2.txCount} giao dịch</span></div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Tổng 2 ngày:</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {dayCompareResult.day1.txCount + dayCompareResult.day2.txCount} giao dịch
                      </span>
                    </div>
                  </div>
                </div>

                {/* BAR CHARTS FOR DAY COMPARISON */}
                {isMounted && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Overall Income vs Expense Day Chart */}
                    <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        📊 Biểu Đồ So Sánh Thu vs Chi (Ngày A vs Ngày B)
                      </h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: `Ngày ${date1}`, income: dayCompareResult.day1.income, expense: dayCompareResult.day1.expense },
                              { name: `Ngày ${date2}`, income: dayCompareResult.day2.income, expense: dayCompareResult.day2.expense },
                            ]}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
                            <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                            <Legend />
                            <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={50} />
                            <Bar dataKey="expense" name="Chi tiêu" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={50} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Category Day Comparison Chart */}
                    <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        📊 Biểu Đồ Chi Tiêu Danh Mục (Ngày A vs Ngày B)
                      </h4>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dayCompareResult.categoryComparison.slice(0, 6)}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={formatAxisVND} />
                            <Tooltip formatter={(value: any) => formatVND(Number(value))} />
                            <Legend />
                            <Bar dataKey="val1" name={`Ngày ${date1}`} fill="#EAB308" radius={[4, 4, 0, 0]} maxBarSize={30} />
                            <Bar dataKey="val2" name={`Ngày ${date2}`} fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* CATEGORY COMPARISON TABLE FOR DAYS */}
                <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Đối Chiếu Chi Tiêu Theo Danh Mục (Ngày {date1} vs Ngày {date2})
                  </h4>

                  {dayCompareResult.categoryComparison.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-6 text-center">Không có giao dịch chi tiêu để so sánh giữa 2 ngày này</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                            <th className="py-3 px-4">Danh Mục</th>
                            <th className="py-3 px-4 text-right">Ngày {date1}</th>
                            <th className="py-3 px-4 text-right">Ngày {date2}</th>
                            <th className="py-3 px-4 text-right">Chênh Lệch (VNĐ)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                          {dayCompareResult.categoryComparison.map((cat, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                {cat.name}
                              </td>
                              <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-400">
                                <AmountDisplay amount={cat.val1} />
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                                <AmountDisplay amount={cat.val2} />
                              </td>
                              <td className="py-3 px-4 text-right font-extrabold">
                                <span className={`inline-flex items-center gap-1 ${cat.diff > 0 ? 'text-rose-500' : cat.diff < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                  {cat.diff > 0 ? '+' : ''}
                                  <AmountDisplay amount={cat.diff} />
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          if (activeTab === 'overview') fetchOverview();
          if (activeTab === 'compare-months') fetchMonthComparison();
          if (activeTab === 'compare-days') fetchDayComparison();
        }}
      />
    </div>
  );
};
