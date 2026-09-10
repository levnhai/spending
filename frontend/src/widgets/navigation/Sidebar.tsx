'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wallet,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  Shield,
  User,
  ShoppingBag,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { APP_NAVIGATION_ITEMS } from '@/shared/config/navigation.config';
import { useUserStore } from '@/entities/user/useUserStore';

export const Sidebar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hiddenMenus, role } = useUserStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Đọc trạng thái thu nhỏ / phóng to từ localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch (_) {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_collapsed', String(next));
      } catch (_) {}
      return next;
    });
  };

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

  const getRoleTheme = () => {
    if (userRole === 'ADMIN') {
      return {
        label: 'Quản Trị Viên',
        sub: 'Quản Trị Hệ Thống',
        badgeBg: 'bg-purple-600 text-white',
        roleBorder: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
        icon: Shield,
        menuTitle: 'Menu Quản Trị',
        activeNav: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/20 font-bold',
      };
    }
    if (userRole === 'SALES') {
      return {
        label: 'Bán Hàng',
        sub: 'Chế độ Bán Hàng',
        badgeBg: 'bg-orange-500 text-white',
        roleBorder: 'border-orange-500/20 bg-orange-500/10 text-orange-400',
        icon: ShoppingBag,
        menuTitle: 'Menu Bán Hàng',
        activeNav: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 font-bold',
      };
    }
    return {
      label: 'Cá Nhân',
      sub: 'Tài Chính Cá Nhân',
      badgeBg: 'bg-emerald-500 text-white',
      roleBorder: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
      icon: User,
      menuTitle: 'Menu Cá Nhân',
      activeNav: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 font-bold',
    };
  };

  const currentTheme = getRoleTheme();
  const RoleIcon = currentTheme.icon;

  return (
    <aside
      className={`hidden md:flex ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex-col h-screen sticky top-0 shrink-0 select-none z-30 transition-all duration-300 ease-in-out overflow-x-hidden`}
    >
      {/* Brand Header */}
      <div
        className={`border-b border-slate-800 flex items-center transition-all duration-300 ${
          isCollapsed ? 'p-4 justify-center' : 'p-6 justify-between'
        }`}
      >
        <Link
          href={userRole === 'ADMIN' ? '/admin' : '/dashboard'}
          className={`flex items-center gap-3 group ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Spending PRO' : undefined}
        >
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 shrink-0 ${
              userRole === 'ADMIN'
                ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 shadow-purple-600/20'
                : 'bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 shadow-emerald-500/20'
            }`}
          >
            {userRole === 'ADMIN' ? (
              <Shield className="w-5 h-5 text-white" />
            ) : userRole === 'SALES' ? (
              <ShoppingBag className="w-5 h-5 text-white" />
            ) : (
              <Wallet className="w-5 h-5 text-white" />
            )}
          </div>

          {!isCollapsed && (
            <div className="min-w-0 animate-in fade-in duration-200">
              <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5 truncate">
                Spending
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md border ${
                    userRole === 'ADMIN'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {userRole === 'ADMIN' ? 'ADMIN' : 'PRO'}
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {currentTheme.sub}
              </p>
            </div>
          )}
        </Link>

        {/* Nút Toggle thu nhỏ khi mở rộng */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Thu nhỏ thanh bên"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role Info Badge */}
      <div className={`pt-3 pb-1 transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        <div
          className={`rounded-2xl border flex items-center transition-all ${currentTheme.roleBorder} ${
            isCollapsed ? 'p-2 justify-center' : 'p-2.5 gap-2.5'
          }`}
          title={`${currentTheme.label} - ${currentTheme.sub}`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${currentTheme.badgeBg}`}
          >
            <RoleIcon className="w-3.5 h-3.5" />
          </div>
          {!isCollapsed && (
            <div className="text-left min-w-0 animate-in fade-in duration-200">
              <span className="text-xs font-bold block text-white truncate">
                {currentTheme.label}
              </span>
              <span className="text-[10px] text-slate-400 opacity-80 truncate block">
                {userRole === 'ADMIN'
                  ? 'Toàn quyền quản trị'
                  : userRole === 'SALES'
                  ? 'Quản lý bán hàng'
                  : 'Quản lý chi tiêu'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav
        className={`flex-1 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar transition-all duration-300 ${
          isCollapsed ? 'px-2' : 'px-4'
        }`}
      >
        {!isCollapsed && (
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider animate-in fade-in duration-200">
            {currentTheme.menuTitle}
          </div>
        )}

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard' || item.href === '/admin'
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              title={item.name}
              className={`flex items-center rounded-2xl text-xs font-semibold transition-all duration-200 group relative ${
                isCollapsed
                  ? 'justify-center p-3'
                  : 'justify-between px-3.5 py-2.5'
              } ${
                isActive
                  ? currentTheme.activeNav
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </div>

              {!isCollapsed && isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Toggle Button (Đáy Sidebar) */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-center">
        <button
          type="button"
          onClick={toggleCollapse}
          className={`w-full py-2.5 px-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all flex items-center gap-2.5 text-xs font-semibold ${
            isCollapsed ? 'justify-center' : 'justify-start'
          }`}
          title={isCollapsed ? 'Phóng to thanh bên' : 'Thu nhỏ thanh bên'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              <span className="truncate">Thu gọn thanh bên</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
