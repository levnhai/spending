'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wallet,
  Settings as SettingsIcon,
  ChevronRight,
  Shield,
  Sparkles,
  User,
  ShoppingBag,
  ArrowLeftRight,
} from 'lucide-react';
import { APP_NAVIGATION_ITEMS } from '@/shared/config/navigation.config';
import { useUserStore } from '@/entities/user/useUserStore';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hiddenMenus, role, switchRole } = useUserStore();

  const userRole = role || user?.role || 'PERSONAL';

  // Lọc menu: Thỏa mãn vai trò (allowedRoles) VÀ không nằm trong danh sách hiddenMenus
  const visibleNavItems = APP_NAVIGATION_ITEMS.filter((item) => {
    // 1. Kiểm tra Role
    if (item.allowedRoles && !item.allowedRoles.includes(userRole)) {
      return false;
    }
    // 2. Kiểm tra danh sách ẩn tùy chỉnh của người dùng
    if (item.isMandatory) return true;
    return !hiddenMenus?.includes(item.href);
  });

  const handleToggleRole = () => {
    const nextRole = userRole === 'PERSONAL' ? 'SALES' : 'PERSONAL';
    switchRole(nextRole);
    router.push('/dashboard');
  };

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
            {userRole === 'SALES' ? (
              <ShoppingBag className="w-5 h-5 text-white" />
            ) : (
              <Wallet className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              Spending
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </span>
            <p className="text-[11px] text-slate-400 font-medium">
              {userRole === 'SALES' ? 'Chế độ Bán Hàng' : 'Tài Chính Cá Nhân'}
            </p>
          </div>
        </Link>
      </div>

      {/* Role Switcher Button */}
      <div className="px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleToggleRole}
          className={`w-full p-2.5 rounded-2xl border flex items-center justify-between transition-all duration-200 ${
            userRole === 'SALES'
              ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30 text-orange-400 hover:border-orange-500/50'
              : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50'
          }`}
          title="Bấm để chuyển đổi giữa Cá Nhân và Bán Hàng"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                userRole === 'SALES'
                  ? 'bg-orange-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {userRole === 'SALES' ? <ShoppingBag className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold block text-white">
                {userRole === 'SALES' ? 'Bán Hàng' : 'Cá Nhân'}
              </span>
              <span className="text-[10px] text-slate-400">Chuyển sang {userRole === 'SALES' ? 'Cá Nhân' : 'Bán Hàng'}</span>
            </div>
          </div>
          <ArrowLeftRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">
          {userRole === 'SALES' ? 'Menu Bán Hàng' : 'Menu Cá Nhân'}
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
