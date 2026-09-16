'use client';

import React from 'react';
import { CustomerStats } from '@/entities/customer';
import { Users, DollarSign, AlertCircle, Award, Sparkles } from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';
import { formatVND } from '@/shared/lib/formatters';

interface CustomerStatsCardsProps {
  stats: CustomerStats | null;
  loading?: boolean;
}

export const CustomerStatsCards: React.FC<CustomerStatsCardsProps> = ({ stats, loading }) => {
  const showAmount = useUserStore((s) => s.showAmount);
  const renderAmount = (val: number) => (showAmount ? formatVND(val) : '••••••••');

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Tổng Khách Hàng',
      value: (stats?.totalCustomers || 0).toLocaleString('vi-VN'),
      subValue: `${stats?.groupCounts?.VIP || 0} Khách VIP`,
      icon: Users,
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      border: 'border-emerald-500/20',
      badge: 'Khách',
    },
    {
      title: 'Tổng Công Nợ',
      value: renderAmount(stats?.totalDebt || 0),
      subValue: `${stats?.debtorsCount || 0} khách chưa trả`,
      icon: AlertCircle,
      color: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      border: 'border-rose-500/25',
      isDanger: (stats?.totalDebt || 0) > 0,
      badge: (stats?.totalDebt || 0) > 0 ? 'Cần thu' : '0 ₫',
    },
    {
      title: 'Doanh Số Tích Lũy',
      value: renderAmount(stats?.totalSpent || 0),
      subValue: 'Tổng tiền mua hàng (LTV)',
      icon: DollarSign,
      color: 'text-cyan-500 dark:text-cyan-400',
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
      border: 'border-cyan-500/20',
    },
    {
      title: 'Khách Quen & Sỉ',
      value: (
        (stats?.groupCounts?.REGULAR || 0) + (stats?.groupCounts?.WHOLESALE || 0)
      ).toLocaleString('vi-VN'),
      subValue: `${stats?.groupCounts?.WHOLESALE || 0} sỉ • ${stats?.groupCounts?.REGULAR || 0} quen`,
      icon: Award,
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
      border: 'border-indigo-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-slate-900 rounded-2xl border ${
              c.isDanger
                ? 'border-rose-300/80 dark:border-rose-500/30 shadow-rose-500/5'
                : 'border-slate-200/80 dark:border-slate-800/80 shadow-sm'
            } p-3 sm:p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between`}
          >
            {/* Header Mini */}
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                {c.title}
              </span>
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${c.bg} ${c.color} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Value & Subtitle */}
            <div className="mt-2 sm:mt-2.5">
              <div
                className={`text-base sm:text-xl font-extrabold tracking-tight ${
                  c.isDanger
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {c.value}
              </div>
              <p
                className={`text-[10px] sm:text-[11px] font-medium mt-0.5 truncate ${
                  c.isDanger ? 'text-rose-500/80 dark:text-rose-400/80' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {c.subValue}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
