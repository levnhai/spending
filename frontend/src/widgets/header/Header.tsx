'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sun, Moon, Bell, Plus, User as UserIcon, LogOut, ChevronDown, Wallet, Target, BarChart3, Tag } from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';

interface HeaderProps {
  title: string;
  onOpenQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenQuickAdd }) => {
  const { user, theme, toggleTheme, logout } = useUserStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="h-16 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between transition-colors duration-300">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Desktop Quick Add Button */}
        {onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm giao dịch</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
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
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user?.fullName || 'Người dùng'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              {/* Navigation Items */}
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

              <Link
                href="/categories"
                onClick={() => setIsUserMenuOpen(false)}
                className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 flex items-center gap-2.5 text-sm font-semibold transition-colors"
              >
                <Tag className="w-4 h-4 text-purple-500" />
                <span>Danh mục thu / chi</span>
              </Link>

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
