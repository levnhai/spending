'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle2,
  Lock,
  Search,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  User,
} from 'lucide-react';
import { ALL_NAV_ITEMS, NAV_GROUPS, NavItemConfig } from '@/shared/config/navigation.config';
import { useUserStore } from '@/entities/user/useUserStore';

export const MenuListSettings: React.FC = () => {
  const { user, role, toggleMenuVisibility, resetMenuVisibility } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [isResetting, setIsResetting] = useState(false);

  const userRole = role || user?.role || 'PERSONAL';
  const hiddenMenus = user?.hiddenMenus || [];

  // 1. Chỉ lấy các menu thuộc Role hiện tại của người dùng
  const roleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(userRole);
  });

  // 2. Lọc theo tìm kiếm và nhóm
  const filteredItems = roleNavItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.href.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGroup = activeGroup === 'all' || item.group === activeGroup;
    return matchSearch && matchGroup;
  });

  const handleReset = async () => {
    setIsResetting(true);
    await resetMenuVisibility();
    setTimeout(() => setIsResetting(false), 500);
  };

  const totalItems = roleNavItems.length;
  const visibleCount = roleNavItems.filter(
    (item) => !hiddenMenus.includes(item.href) && !hiddenMenus.includes(item.id),
  ).length;
  const hiddenCount = totalItems - visibleCount;

  // Lọc các nhóm có chứa menu của role hiện tại
  const availableGroups = Object.entries(NAV_GROUPS).filter(([key]) => {
    return roleNavItems.some((item) => item.group === key);
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Stats Bar */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/20 dark:via-slate-800/50 p-5 rounded-2xl border border-emerald-500/20 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm mb-1">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Tùy biến hiển thị thanh điều hướng</span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ml-1 ${
                userRole === 'SALES'
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}
            >
              Chế độ {userRole === 'SALES' ? 'Bán Hàng' : 'Cá Nhân'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Danh sách Menu {userRole === 'SALES' ? 'Bán Hàng' : 'Cá Nhân'} ({totalItems} menu)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Bật hoặc tắt các mục menu mà bạn không thường xuyên sử dụng trong chế độ{' '}
            <strong>{userRole === 'SALES' ? 'Bán Hàng' : 'Cá Nhân'}</strong>. Cấu hình được lưu tự động theo tài khoản của bạn.
          </p>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold">
            <span className="text-emerald-500">{visibleCount} Hiển thị</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-amber-500">{hiddenCount} Đã ẩn</span>
          </div>

          <button
            onClick={handleReset}
            disabled={hiddenCount === 0 || isResetting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Hiện lại tất cả menu"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Khôi phục mặc định</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm mục menu hoặc mô tả..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:focus:ring-emerald-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Group Tabs (chỉ hiện các nhóm có menu) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveGroup('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              activeGroup === 'all'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tất cả ({totalItems})
          </button>
          {availableGroups.map(([key, label]) => {
            const count = roleNavItems.filter((item) => item.group === key).length;
            return (
              <button
                key={key}
                onClick={() => setActiveGroup(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeGroup === key
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label.split('&')[0].trim()} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* List Menu Grid / Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredItems.map((item: NavItemConfig) => {
          const Icon = item.icon;
          const isHidden = hiddenMenus.includes(item.href) || hiddenMenus.includes(item.id);
          const isMandatory = item.isMandatory;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex items-start justify-between gap-4 ${
                isHidden
                  ? 'bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/60 opacity-60 hover:opacity-100'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/30'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Menu Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isHidden
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      : userRole === 'SALES'
                      ? 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                      : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Name, Path & Description */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {item.href}
                    </span>
                    {isMandatory ? (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" />
                        Bắt buộc
                      </span>
                    ) : isHidden ? (
                      <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Đã ẩn
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Hiển thị
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Switch Toggle */}
              <div className="shrink-0 pt-0.5">
                {isMandatory ? (
                  <div
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    title="Menu cốt lõi bắt buộc hiển thị"
                  >
                    <Lock className="w-4 h-4" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleMenuVisibility(item.href)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
                      !isHidden ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={!isHidden}
                    title={!isHidden ? 'Bấm để ẩn khỏi menu' : 'Bấm để hiển thị lên menu'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        !isHidden ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-slate-400 text-sm">Không tìm thấy mục menu nào phù hợp với vai trò này.</p>
        </div>
      )}
    </div>
  );
};
