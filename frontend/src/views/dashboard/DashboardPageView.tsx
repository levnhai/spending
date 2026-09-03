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

  const handleStatusChanged = (orderId: string, newStatus: OrderStatusType) => {
    setRecentOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)),
    );
    orderApi.getStats({ period: salesPeriod }).then(setOrderStats).catch(() => {});
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Kỳ Thống Kê
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Xem báo cáo theo ngày, tuần, tháng, năm hoặc tất cả
                  </span>
                </div>
              </div>

              {/* Segmented Period Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto">
                {SALES_PERIODS.map((p) => {
                  const isActive = salesPeriod === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSalesPeriod(p.id)}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sales KPI Cards Grid (6 Thẻ chỉ số chuẩn) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Card 1: Tổng Doanh Thu */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tổng Doanh Thu
                    </span>
                    <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {renderAmount(orderStats?.totalRevenue || 0)}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Doanh thu thuần:</span>
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">{renderAmount(orderStats?.netRevenue || 0)}</strong>
                </div>
              </div>

              {/* Card 2: Phí Vận Chuyển (Ship) */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Phí Vận Chuyển
                    </span>
                    <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <Truck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1">
                    {renderAmount(orderStats?.totalShippingFee || 0)}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                  Tổng tiền cước ship hàng
                </div>
              </div>

              {/* Card 3: Tiền Vốn (Giá Vốn Hàng Bán) */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tiền Vốn
                    </span>
                    <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-amber-500 mt-1">
                    {renderAmount(orderStats?.totalCostPrice || 0)}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                  Tổng giá vốn hàng đã bán
                </div>
              </div>

              {/* Card 4: Lợi Nhuận Ròng & Tỷ Suất */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Lợi Nhuận
                    </span>
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className={`text-xl font-black mt-1 ${isPositiveProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {renderAmount(orderStats?.profit || 0)}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Tỷ suất lợi nhuận:</span>
                  <strong className={`font-bold ${isPositiveProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {orderStats?.profitMargin || 0}%
                  </strong>
                </div>
              </div>

              {/* Card 5: Tổng Đơn Hàng & Hoàn Thành */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Đơn Hàng
                    </span>
                    <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-500">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {orderStats?.totalOrders || 0} <span className="text-xs font-semibold text-slate-400">đơn</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Hoàn thành:</span>
                  <strong className="text-purple-600 dark:text-purple-400 font-bold">
                    {orderStats?.completedOrders || 0} ({orderStats?.completionRate || 0}%)
                  </strong>
                </div>
              </div>

              {/* Card 6: Công Nợ Còn Lại & Thực Thu */}
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Chưa Thu (Công Nợ)
                    </span>
                    <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl font-black text-rose-500 mt-1">
                    {renderAmount(orderStats?.totalRemaining || 0)}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Đã thu:</span>
                  <strong className="text-emerald-500 font-bold">{renderAmount(orderStats?.totalPaid || 0)}</strong>
                </div>
              </div>
            </div>

            {/* 2 BIỂU ĐỒ BÁN HÀNG: 1 LÀ TIỀN, 1 LÀ TRẠNG THÁI ĐƠN HÀNG */}
            <SalesChartsSection stats={orderStats} />

            {/* Danh sách đơn hàng gần đây */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Đơn Hàng ({recentOrders.length})
                  </h3>
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

              <OrderTable
                orders={recentOrders}
                loading={loading}
                onEdit={(order) => {
                  setOrderToEdit(order);
                  setIsOrderModalOpen(true);
                }}
                onDeleted={fetchData}
                onStatusChanged={handleStatusChanged}
              />
            </div>
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
