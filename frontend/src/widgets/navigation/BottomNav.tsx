'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Plus, CalendarDays, PieChart, ShoppingBag, Users } from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();
  const { user, role } = useUserStore();
  const userRole = role || user?.role || 'PERSONAL';

  // Menu cho chế độ BÁN HÀNG (SALES): Dashboard, (+) Thêm Đơn, Đơn Hàng
  if (userRole === 'SALES') {
    const isDashboard = pathname === '/dashboard';
    const isOrders = pathname === '/orders';

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-8 z-40">
        {/* Tab 1: Dashboard */}
        <Link
          href="/dashboard"
          prefetch={true}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            isDashboard
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </Link>

        {/* Nút giữa (+): Thêm Đơn Hàng */}
        <div className="relative -top-4 flex flex-col items-center flex-1">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform cursor-pointer"
            aria-label="Thêm đơn hàng mới"
            title="Thêm đơn hàng mới"
          >
            <Plus className="w-6 h-6" />
          </button>
          <span className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 mt-1">
            Thêm đơn
          </span>
        </div>

        {/* Tab 2: Quản Lý Đơn Hàng */}
        <Link
          href="/orders"
          prefetch={true}
          className={`flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors ${
            isOrders
              ? 'text-emerald-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span>Đơn hàng</span>
        </Link>
      </div>
    );
  }

  // Menu mặc định cho chế độ CÁ NHÂN (PERSONAL)
  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Giao dịch', href: '/transactions', icon: Receipt },
    { name: 'Hóa đơn', href: '/bills', icon: CalendarDays },
    { name: 'Ngân sách', href: '/budgets', icon: PieChart },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40">
      {items.slice(0, 2).map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-emerald-500 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </Link>
        );
      })}

      {/* Quick Add Floating Center Button */}
      <div className="relative -top-4">
        <button
          onClick={onOpenQuickAdd}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform cursor-pointer"
          aria-label="Thêm nhanh giao dịch"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {items.slice(2, 4).map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center justify-center w-14 py-1 text-[11px] font-medium transition-colors ${
              isActive ? 'text-emerald-500 font-semibold' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};
