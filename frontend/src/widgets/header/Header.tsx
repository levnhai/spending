'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Bell,
  Plus,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Wallet,
  Target,
  BarChart3,
  Tag,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ShoppingBag,
} from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';

interface HeaderProps {
  title: string;
  onOpenQuickAdd?: () => void;
  onOpenQuickAddOrder?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenQuickAdd,
  onOpenQuickAddOrder,
}) => {
  const router = useRouter();
  const { user, theme, toggleTheme, logout, showAmount, toggleShowAmount, role } = useUserStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userRole = role || user?.role || 'PERSONAL';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[calc(4rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 flex items-center justify-between transition-colors duration-200 shadow-sm">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Nút Thêm Đơn Hàng (Role Bán Hàng - Ẩn trên mobile vì đã có BottomNav) */}
        {userRole === 'SALES' && onOpenQuickAddOrder && (
          <button
            onClick={onOpenQuickAddOrder}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm đơn hàng</span>
          </button>
        )}

        {/* Nút Thêm Giao Dịch (Role Cá Nhân - Ẩn trên mobile vì đã có BottomNav) */}
        {userRole === 'PERSONAL' && onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giao dịch</span>
          </button>
        )}

        {/* Toggle Show/Hide Amount Button (Hiển thị cả trên mobile & desktop) */}
        <button
          onClick={toggleShowAmount}
          className="flex p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors items-center justify-center cursor-pointer"
          title={showAmount ? 'Ẩn số tiền' : 'Hiển thị số tiền'}
        >
          {showAmount ? (
            <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-500" />
          ) : (
            <EyeOff className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-400" />
          )}
        </button>

        {/* Notification Bell (Ẩn trên mobile) */}
        <button
          className="hidden sm:flex p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors cursor-pointer"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        {/* User Info & Dropdown Trigger */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={dropdownRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-indigo-500/20">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {user?.fullName || 'Tài khoản'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Popup */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Header Info */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user?.fullName || 'Người dùng'}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                        userRole === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                          : userRole === 'SALES'
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {userRole === 'ADMIN' ? 'Admin' : userRole === 'SALES' ? 'Bán hàng' : 'Cá nhân'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              {userRole === 'PERSONAL' && (
                <>
                  <Link
                    href="/wallets"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 text-sm font-semibold transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <span>Ví & Nguồn tiền</span>
                  </Link>

                  <Link
                    href="/savings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 text-sm font-semibold transition-colors"
                  >
                    <Target className="w-4 h-4 text-cyan-500" />
                    <span>Mục tiêu tiết kiệm</span>
                  </Link>

                  <Link
                    href="/reports"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 text-sm font-semibold transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span>Báo cáo & Thống kê</span>
                  </Link>
                </>
              )}

              {userRole === 'SALES' && (
                <Link
                  href="/orders"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 text-sm font-semibold transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  <span>Quản Lý Đơn Hàng</span>
                </Link>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

              {/* Toggle Dark/Light Mode */}
              <button
                onClick={toggleTheme}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center justify-between text-sm font-semibold transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>Giao diện {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              {/* Settings Page Link */}
              <Link
                href="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 text-sm font-semibold transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Cài đặt hệ thống</span>
              </Link>

              <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-rose-500/10 text-rose-500 flex items-center gap-2.5 text-sm font-bold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
