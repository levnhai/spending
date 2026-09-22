'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  Truck,
  DollarSign,
  Calendar,
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Header } from '@/widgets/header/Header';
import { MetricsOverviewCards } from '@/widgets/dashboard-metrics/MetricsOverviewCards';
import { ChartsSection } from '@/widgets/analytics-charts/ChartsSection';
import { SalesChartsSection } from '@/widgets/sales-charts';
import { TransactionListWidget } from '@/widgets/transaction-list/TransactionListWidget';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { AddEditOrderModal } from '@/features/order-management';
import { OrderTable } from '@/widgets/order-table';
import {
  analyticsApi,
  DashboardSummary,
  PieChartItem,
  BarChartItem,
  LineChartItem,
  TopCategoryItem,
  WeeklyChartItem,
} from '@/entities/analytics/analyticsApi';
import {
  transactionApi,
  Transaction,
} from '@/entities/transaction/transactionApi';
import { Order, OrderStats, OrderStatusType, orderApi, ORDER_STATUS_CONFIG } from '@/entities/order';
import { useUserStore } from '@/entities/user/useUserStore';
import { formatVND } from '@/shared/lib/formatters';

const SALES_PERIODS: { id: 'today' | 'week' | 'month' | 'year' | 'all'; label: string }[] = [
  { id: 'today', label: 'Hôm nay' },
  { id: 'week', label: 'Tuần này' },
  { id: 'month', label: 'Tháng này' },
  { id: 'year', label: 'Năm nay' },
  { id: 'all', label: 'Tất cả' },
];

const ORDER_STATUS_OPTIONS = [
  { id: 'ALL', label: 'Tất cả trạng thái', dot: 'bg-slate-400' },
  { id: 'ORDERED', label: 'Đã đặt', dot: 'bg-blue-500' },
  { id: 'CN_WAREHOUSE', label: 'Kho Trung', dot: 'bg-cyan-500' },
  { id: 'VN_WAREHOUSE', label: 'Kho Việt', dot: 'bg-orange-500' },
  { id: 'AT_HOME', label: 'Nhà', dot: 'bg-purple-500' },
  { id: 'COMPLETED', label: 'Thành công', dot: 'bg-emerald-500' },
  { id: 'CANCELLED', label: 'Đã hủy', dot: 'bg-rose-500' },
];

export const DashboardPageView: React.FC = () => {
  const { user, role, showAmount } = useUserStore();
  const userRole = role || user?.role || 'PERSONAL';

  const renderAmount = (val: number) => (showAmount ? formatVND(val) : '••••••••');

  // State cho Role Cá Nhân
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pieData, setPieData] = useState<PieChartItem[]>([]);
  const [barData, setBarData] = useState<BarChartItem[]>([]);
  const [lineData, setLineData] = useState<LineChartItem[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategoryItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyChartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // State cho Role Bán Hàng
  const [salesPeriod, setSalesPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  // Filter trạng thái đơn hàng
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (userRole === 'SALES') {
        // Load data Bán hàng theo Period
        const [statsRes, ordersRes] = await Promise.all([
          orderApi.getStats({ period: salesPeriod }).catch(() => null),
          orderApi.getAll({ period: salesPeriod }).catch(() => []),
        ]);
        if (statsRes) setOrderStats(statsRes);
        if (ordersRes) setRecentOrders(ordersRes);
      } else {
        // Load data Cá nhân
        const [sumRes, pieRes, barRes, lineRes, topRes, weeklyRes, txRes] =
          await Promise.all([
            analyticsApi.getSummary().catch(() => null),
            analyticsApi.getPieChart().catch(() => []),
            analyticsApi.getBarChart().catch(() => []),
            analyticsApi.getLineChart().catch(() => []),
            analyticsApi.getTopCategories().catch(() => []),
            analyticsApi.getWeeklyChart().catch(() => []),
            transactionApi.getAll().catch(() => []),
          ]);

        if (sumRes) setSummary(sumRes);
        if (pieRes) setPieData(pieRes);
        if (barRes) setBarData(barRes);
        if (lineRes) setLineData(lineRes);
        if (topRes) setTopCategories(topRes);
        if (weeklyRes) setWeeklyData(weeklyRes);
        if (txRes) setTransactions(txRes);
      }
    } catch (e) {
      console.error('Fetch dashboard data error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole, salesPeriod]);

  const handleStatusChanged = async (orderId: string, newStatus: OrderStatusType) => {
    const prevOrders = [...recentOrders];
    const isCompleted = newStatus === 'COMPLETED';
    const updated = recentOrders.map((o) => {
      if (o._id === orderId) {
        const tot = o.totalAmount || 0;
        return {
          ...o,
          status: newStatus,
          paidAmount: isCompleted ? tot : o.paidAmount,
          paymentStatus: isCompleted ? 'PAID' : o.paymentStatus,
          customers: (o.customers || []).map((c) => ({
            ...c,
            status: newStatus,
            paidAmount: isCompleted ? (c.amount || 0) : c.paidAmount,
            paymentStatus: isCompleted ? 'PAID' : c.paymentStatus,
          })),
        };
      }
      return o;
    });
    setRecentOrders(updated);

    try {
      const saved = await orderApi.updateStatus(orderId, newStatus);
      if (saved) {
        setRecentOrders((prev) => prev.map((o) => (o._id === orderId ? saved : o)));
      }
    } catch (err) {
      console.error('Failed to update status in dashboard', err);
      setRecentOrders(prevOrders);
    }
  };

  const isPositiveProfit = (orderStats?.profit || 0) >= 0;

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6 w-full">
      <Header
        title={userRole === 'SALES' ? 'Tổng Quan Bán Hàng' : 'Tổng Quan Tài Chính'}
        onOpenQuickAdd={userRole === 'PERSONAL' ? () => setIsTxModalOpen(true) : undefined}
        onOpenQuickAddOrder={userRole === 'SALES' ? () => { setOrderToEdit(null); setIsOrderModalOpen(true); } : undefined}
      />

      <main className="px-4 md:px-8 space-y-6 w-full">
        {/* ======================= GIAO DIỆN ROLE BÁN HÀNG ======================= */}
        {userRole === 'SALES' && (
          <div className="space-y-6">
            {/* Thanh chọn mốc thời gian (Ngày, Tuần, Tháng, Năm, Tất cả) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>Kỳ Thống Kê</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    Xem báo cáo theo ngày, tuần, tháng, năm hoặc tất cả
                  </p>
                </div>
              </div>

              {/* Segmented Period Tabs */}
              <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl sm:rounded-2xl w-full sm:w-auto overflow-x-auto no-scrollbar border border-slate-200/60 dark:border-slate-700/60">
                {SALES_PERIODS.map((p) => {
                  const isActive = salesPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSalesPeriod(p.id)}
                      className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer select-none text-center ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 dark:bg-emerald-500 dark:text-white'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sales KPI Cards Grid (Mobile: 2 cột, Tablet: 3 cột, Desktop: 6 cột) */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
              {/* Card 1: Tổng Doanh Thu */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      Tổng Doanh Thu
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                      <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate">
                    {renderAmount(orderStats?.totalRevenue || 0)}
                  </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate">Thuần:</span>
                  <strong className="text-blue-600 dark:text-blue-400 font-bold truncate">{renderAmount(orderStats?.netRevenue || 0)}</strong>
                </div>
              </div>

              {/* Card 2: Phí Vận Chuyển (Ship) */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      Phí Vận Chuyển
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
                      <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-xl font-black text-cyan-600 dark:text-cyan-400 mt-0.5 sm:mt-1 truncate">
                    {renderAmount(orderStats?.totalShippingFee || 0)}
                  </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 truncate">
                  Tổng cước ship hàng
                </div>
              </div>

              {/* Card 3: Tiền Vốn (Giá Vốn Hàng Bán) */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      Tiền Vốn
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                      <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-xl font-black text-amber-500 mt-0.5 sm:mt-1 truncate">
                    {renderAmount(orderStats?.totalCostPrice || 0)}
                  </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 truncate">
                  Tổng giá vốn đã bán
                </div>
              </div>

              {/* Card 4: Lợi Nhuận Ròng & Tỷ Suất */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      Lợi Nhuận
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className={`text-base sm:text-xl font-black mt-0.5 sm:mt-1 truncate ${isPositiveProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {renderAmount(orderStats?.profit || 0)}
                  </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate">Tỷ suất:</span>
                  <strong className={`font-bold truncate ${isPositiveProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {orderStats?.profitMargin || 0}%
                  </strong>
                </div>
              </div>

              {/* Card 5: Tổng Đơn Hàng & Hoàn Thành */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      Đơn Hàng
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                      <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5 sm:mt-1 truncate">
                    {orderStats?.totalOrders || 0} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">đơn</span>
                  </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate">Hoàn thành:</span>
                  <strong className="text-purple-600 dark:text-purple-400 font-bold truncate">
                    {orderStats?.completedOrders || 0} ({orderStats?.completionRate || 0}%)
                  </strong>
                </div>
              </div>

              {/* Card 6: Công Nợ Còn Lại & Thực Thu */}
              <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-1.5 sm:space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                      Chưa Thu
                    </span>
                    <div className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="text-base sm:text-xl font-black text-rose-500 mt-0.5 sm:mt-1 truncate">
                    {renderAmount(orderStats?.totalRemaining || 0)}
                  </div>
                </div>
                <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 flex items-center justify-between gap-1">
                  <span className="truncate">Đã thu:</span>
                  <strong className="text-emerald-500 font-bold truncate">{renderAmount(orderStats?.totalPaid || 0)}</strong>
                </div>
              </div>
            </div>

            {/* 2 BIỂU ĐỒ BÁN HÀNG: 1 LÀ TIỀN, 1 LÀ TRẠNG THÁI ĐƠN HÀNG */}
            <SalesChartsSection stats={orderStats} />

            {/* Danh sách đơn hàng gần đây */}
            {(() => {
              const filteredOrders =
                orderStatusFilter === 'ALL'
                  ? recentOrders
                  : recentOrders.filter((o) => o.status === orderStatusFilter);

              const selectedStatusObj = ORDER_STATUS_OPTIONS.find(
                (s) => s.id === orderStatusFilter
              );

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-500 shrink-0" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        <span>Đơn Hàng</span>{' '}
                        <span className="text-sm font-semibold text-slate-400">
                          ({filteredOrders.length}
                          {orderStatusFilter !== 'ALL'
                            ? `/${recentOrders.length}`
                            : ''}
                          )
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* NÚT ICON FILTER & SELECT TRẠNG THÁI */}
                      <div className="relative" ref={filterDropdownRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setIsFilterDropdownOpen((prev) => !prev)
                          }
                          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer select-none ${
                            orderStatusFilter !== 'ALL'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-sm'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                          title="Lọc đơn hàng theo trạng thái"
                        >
                          <Filter
                            className={`w-3.5 h-3.5 ${
                              orderStatusFilter !== 'ALL'
                                ? 'text-emerald-500'
                                : 'text-slate-400'
                            }`}
                          />
                          <span className="hidden sm:inline">
                            {selectedStatusObj?.label || 'Bộ lọc'}
                          </span>
                          {orderStatusFilter !== 'ALL' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 sm:hidden" />
                          )}
                          <ChevronDown
                            className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                              isFilterDropdownOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Dropdown Menu Danh Sách Trạng Thái */}
                        {isFilterDropdownOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                              Lọc theo trạng thái
                            </div>
                            <div className="py-1">
                              {ORDER_STATUS_OPTIONS.map((opt) => {
                                const isSelected = orderStatusFilter === opt.id;
                                const count =
                                  opt.id === 'ALL'
                                    ? recentOrders.length
                                    : recentOrders.filter(
                                        (o) => o.status === opt.id
                                      ).length;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => {
                                      setOrderStatusFilter(opt.id);
                                      setIsFilterDropdownOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer text-left ${
                                      isSelected
                                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-2 h-2 rounded-full ${opt.dot}`}
                                      />
                                      <span>{opt.label}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                        {count}
                                      </span>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="hidden sm:flex items-center gap-2">
                        <button
                          onClick={() => {
                            setOrderToEdit(null);
                            setIsOrderModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tạo đơn mới</span>
                        </button>
                        <Link
                          href="/orders"
                          className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Trang quản lý đơn
                        </Link>
                      </div>
                    </div>
                  </div>

                  <OrderTable
                    orders={filteredOrders}
                    loading={loading}
                    onEdit={(order) => {
                      setOrderToEdit(order);
                      setIsOrderModalOpen(true);
                    }}
                    onDeleted={fetchData}
                    onStatusChanged={handleStatusChanged}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* ======================= GIAO DIỆN ROLE CÁ NHÂN ======================= */}
        {userRole === 'PERSONAL' && (
          <>
            <MetricsOverviewCards data={summary} isLoading={loading} />
            <ChartsSection
              pieData={pieData}
              barData={barData}
              lineData={lineData}
              topCategories={topCategories}
              weeklyData={weeklyData}
            />
            <TransactionListWidget
              transactions={transactions}
              onRefresh={fetchData}
            />
          </>
        )}
      </main>

      {/* Modal Quick Add Transaction cho Role Cá Nhân */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* Modal Quick Add/Edit Order cho Role Bán Hàng */}
      <AddEditOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={fetchData}
        orderToEdit={orderToEdit}
      />
    </div>
  );
};
