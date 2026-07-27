'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  CalendarDays,
  Target,
  FileSpreadsheet,
  LogOut,
  TrendingUp,
  Tag,
  CheckSquare,
  Calculator,
} from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Giao dịch', href: '/transactions', icon: Receipt },
  { name: 'Ví & Tài khoản', href: '/wallets', icon: Wallet },
  { name: 'Danh mục', href: '/categories', icon: Tag },
  { name: 'Kế hoạch tháng', href: '/monthly-plan', icon: Calculator },
  { name: 'Ngân sách', href: '/budgets', icon: PieChart },
  { name: 'Hóa đơn định kỳ', href: '/bills', icon: CalendarDays },
  { name: 'Mục tiêu tiết kiệm', href: '/savings', icon: Target },
  { name: 'Ghi chú & Công việc', href: '/notes', icon: CheckSquare },
  { name: 'Báo cáo & Export', href: '/reports', icon: FileSpreadsheet },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const logout = useUserStore((s) => s.logout);

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-30 transition-colors duration-300">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">FinFlow</span>
          <span className="text-[10px] block font-semibold text-emerald-500 uppercase tracking-widest">Expense Pro</span>
        </div>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm text-rose-500 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};
