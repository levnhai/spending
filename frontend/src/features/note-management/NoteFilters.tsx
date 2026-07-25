'use client';

import React from 'react';
import { Search, Plus, CheckSquare, StickyNote, Filter } from 'lucide-react';
import { NoteType } from '@/entities/note';

interface NoteFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTab: 'all' | 'note' | 'task';
  onTabChange: (tab: 'all' | 'note' | 'task') => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  onOpenCreateModal: () => void;
}

export const NoteFilters: React.FC<NoteFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedCategory,
  onCategoryChange,
  categories,
  onOpenCreateModal,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Search & Categories */}
      <div className="flex items-center gap-3 flex-1 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm ghi chú, công việc, nhãn..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm transition-all"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm cursor-pointer pr-8 appearance-none"
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tabs & Create Button */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tabs switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => onTabChange('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => onTabChange('note')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'note'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            Ghi chú
          </button>
          <button
            onClick={() => onTabChange('task')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'task'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Công việc (Task)
          </button>
        </div>

        {/* Add button */}
        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-medium text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mới</span>
        </button>
      </div>
    </div>
  );
};
