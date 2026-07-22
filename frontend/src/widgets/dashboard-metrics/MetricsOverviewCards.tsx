'use client';

import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Calendar, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardSummary } from '@/entities/analytics/analyticsApi';
import { formatVND } from '@/shared/lib/formatters';

interface MetricsProps {
  data: DashboardSummary | null;
  isLoading?: boolean;
}

export const MetricsOverviewCards: React.FC<MetricsProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng Số Dư',
      value: formatVND(data.totalBalance),
      subtitle: 'Tất cả các ví',
      icon: Wallet,
      color: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-500',
    },
    {
      title: 'Thu Nhập Tháng',
      value: formatVND(data.monthlyIncome),
      subtitle: 'Tháng này',
      icon: TrendingUp,
      badgeIcon: ArrowUpRight,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
    },
    {
      title: 'Chi Tiêu Tháng',
      value: formatVND(data.monthlyExpense),
      subtitle: 'Tháng này',
      icon: TrendingDown,
      badgeIcon: ArrowDownRight,
      color: 'from-rose-500 to-pink-600',
      textColor: 'text-rose-500',
    },
    {
      title: 'Chi Tiêu Hôm Nay',
      value: formatVND(data.todayExpense),
      subtitle: 'Hôm nay',
      icon: Calendar,
      color: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-500',
    },
    {
      title: 'Thu Nhập Hôm Nay',
      value: formatVND(data.todayIncome),
      subtitle: 'Hôm nay',
      icon: TrendingUp,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-500',
    },
    {
      title: 'Tổng Giao Dịch',
      value: `${data.totalTransactions} lượt`,
      subtitle: 'Lịch sử ghi chép',
      icon: CreditCard,
      color: 'from-violet-500 to-indigo-600',
      textColor: 'text-violet-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {card.value}
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block mt-1">
              {card.subtitle}
            </span>
          </div>
        );
      })}
    </div>
  );
};
