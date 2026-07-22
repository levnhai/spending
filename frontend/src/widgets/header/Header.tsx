'use client';

import React from 'react';
import { Sun, Moon, Bell, Plus, User as UserIcon } from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';

interface HeaderProps {
  title: string;
  onOpenQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenQuickAdd }) => {
  const { user, theme, toggleTheme } = useUserStore();

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

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Đổi giao diện Dark/Light"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>

        {/* Notification Bell */}
        <button
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          title="Thông báo"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
          </div>
          <span className="hidden sm:block text-sm font-semibold text-slate-800 dark:text-slate-200">
            {user?.fullName || 'User'}
          </span>
        </div>
      </div>
    </header>
  );
};
