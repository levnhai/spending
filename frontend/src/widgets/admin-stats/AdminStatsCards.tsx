'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  UserCheck,
  UserX,
  CreditCard,
  Percent,
} from 'lucide-react';
import { AdminStats } from '@/entities/admin';

interface AdminStatsCardsProps {
  stats: AdminStats | null;
  loading: boolean;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-36 rounded-3xl bg-slate-800/40 border border-slate-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const activeRate = stats.users.total
    ? Math.round((stats.users.active / stats.users.total) * 100)
    : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tổng người dùng */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800/80 p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400">Tổng Người Dùng</span>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-black text-white tracking-tight">
            {stats.users.total}
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            +{stats.users.newLast30Days} mới (30 ngày)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="text-emerald-400 font-medium">
            {stats.users.personal} cá nhân
          </span>
          <span>•</span>
          <span className="text-orange-400 font-medium">
            {stats.users.sales} bán hàng
          </span>
          <span>•</span>
          <span className="text-purple-400 font-medium">
            {stats.users.admin} admin
          </span>
        </div>
      </div>

      {/* Card 2: Trạng thái & Tỷ lệ hoạt động */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800/80 p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400">Tỷ Lệ Hoạt Động</span>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-black text-white tracking-tight">
            {activeRate}%
          </span>
          <span className="text-[11px] font-medium text-emerald-400">
            {stats.users.active} tài khoản mở
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span className="text-rose-400 font-medium">
            {stats.users.blocked} tài khoản bị khóa
          </span>
        </div>
      </div>

      {/* Card 3: Dòng tiền hệ thống */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800/80 p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400">Giao Dịch Hệ Thống</span>
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-black text-white tracking-tight">
            {stats.finance.totalTransactions}
          </span>
          <span className="text-[11px] text-slate-400">giao dịch</span>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
          <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            {formatCurrency(stats.finance.totalIncome)}
          </span>
          <span className="text-rose-400 flex items-center gap-0.5 font-medium">
            <ArrowDownRight className="w-3 h-3" />
            {formatCurrency(stats.finance.totalExpense)}
          </span>
        </div>
      </div>

      {/* Card 4: Doanh số bán hàng (Order) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800/80 p-5 shadow-xl hover:border-slate-700/80 transition-all duration-300 group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all duration-500" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400">Bán Hàng & Doanh Số</span>
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-black text-white tracking-tight">
            {stats.sales.totalOrders}
          </span>
          <span className="text-[11px] text-slate-400">đơn hàng</span>
        </div>
        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
          <span className="text-orange-400 font-medium truncate">
            DT: {formatCurrency(stats.sales.totalRevenue)}
          </span>
          <span className="text-emerald-400 font-medium truncate">
            Lãi: {formatCurrency(stats.sales.totalProfit)}
          </span>
        </div>
      </div>
    </div>
  );
};
