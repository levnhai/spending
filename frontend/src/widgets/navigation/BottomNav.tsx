'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Receipt, Plus, CalendarDays, PieChart } from 'lucide-react';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();

  const items = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Giao dịch', href: '/transactions', icon: Receipt },
    { name: 'Hóa đơn', href: '/bills', icon: CalendarDays },
    { name: 'Ngân sách', href: '/budgets', icon: PieChart },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-40">
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
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 transition-transform"
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
