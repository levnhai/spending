"use client";

import React from "react";
import { CustomerGroupType, CUSTOMER_GROUP_CONFIG } from "@/entities/customer";
import {
  Search,
  Plus,
  AlertCircle,
  ArrowUpDown,
  RefreshCw,
  X,
} from "lucide-react";

interface CustomerFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  hasDebtOnly: boolean;
  onHasDebtToggle: () => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  onAddNew: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export const CustomerFilterBar: React.FC<CustomerFilterBarProps> = ({
  search,
  onSearchChange,
  selectedGroup,
  onGroupChange,
  hasDebtOnly,
  onHasDebtToggle,
  sortBy,
  onSortByChange,
  onAddNew,
  onRefresh,
  loading,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-4 shadow-sm space-y-3">
      {/* Search Input & Top Action Buttons */}
      <div className="flex gap-2 items-center">
        {/* Search input with clear button */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm tên, SĐT, Facebook, địa chỉ..."
            className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        )}

        {/* Add Customer button */}
        <button
          type="button"
          onClick={onAddNew}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 hover:opacity-95 transition-all active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline sm:inline">Thêm Khách</span>
          <span className="xs:hidden sm:hidden">Thêm</span>
        </button>
      </div>

      {/* Group Pills Scrollable Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onGroupChange("")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            selectedGroup === ""
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold shadow-sm"
              : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent"
          }`}
        >
          Tất cả
        </button>
        {(Object.keys(CUSTOMER_GROUP_CONFIG) as CustomerGroupType[]).map(
          (g) => {
            const conf = CUSTOMER_GROUP_CONFIG[g];
            const isSelected = selectedGroup === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => onGroupChange(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                  isSelected
                    ? `${conf.bg} ${conf.text} ${conf.border} shadow-sm font-bold`
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {conf.label}
              </button>
            );
          },
        )}
      </div>

      {/* Sub Filters: Debt Toggle & Sort Options */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {/* Toggle Khách có nợ */}
        <button
          type="button"
          onClick={onHasDebtToggle}
          className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
            hasDebtOnly
              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-bold shadow-sm"
              : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          <span>Đang nợ tiền</span>
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="appearance-none pl-2.5 sm:pl-3 pr-7 sm:pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
          >
            <option value="createdAt_desc">Mới nhất</option>
            <option value="debtAmount_desc">Nợ nhiều nhất</option>
            <option value="totalSpent_desc">Chi tiêu cao nhất</option>
            <option value="name_asc">Tên (A-Z)</option>
          </select>
          <ArrowUpDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
