'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { budgetApi, Budget } from '@/entities/budget/budgetApi';
import { categoryApi, Category } from '@/entities/category/categoryApi';
import { formatVND } from '@/shared/lib/formatters';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { useUserStore } from '@/entities/user/useUserStore';

export const BudgetsPageView: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const showAmount = useUserStore((s) => s.showAmount);

  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const fetchBudgets = async () => {
    try {
      const data = await budgetApi.getAll(month, year);
      setBudgets(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBudgets();
    categoryApi.getAll('expense').then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0]._id);
    });
  }, [month, year]);

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await budgetApi.create({
        categoryId,
        limitAmount: Number(limitAmount),
        month,
        year,
      });
      setLimitAmount('');
      setIsAddBudgetOpen(false);
      fetchBudgets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm('Xóa hạn mức ngân sách này?')) {
      try {
        await budgetApi.delete(id);
        fetchBudgets();
      } catch (e) {
        alert('Xóa thất bại');
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Quản Lý Hạn Mức Ngân Sách" onOpenQuickAdd={() => setIsModalOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ngân Sách Tháng {month}/{year}</h2>
            <p className="text-xs text-slate-400">Thiết lập & kiểm soát hạn mức chi tiêu từng danh mục</p>
          </div>

          <button
            onClick={() => setIsAddBudgetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Hạn Mức</span>
          </button>
        </div>

        {/* Budgets Grid */}
        {budgets.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm glass-card rounded-3xl">
            Chưa có hạn mức ngân sách nào cho tháng này. Hãy bấm "Thêm Hạn Mức" để quản lý!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((b) => {
              const isExceeded = b.isExceeded;
              const isWarning = b.isWarning && !isExceeded;

              return (
                <div
                  key={b._id}
                  className={`p-6 rounded-3xl glass-card border space-y-4 transition-all ${
                    isExceeded
                      ? 'border-rose-500/50 bg-rose-500/5'
                      : isWarning
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-slate-200/80 dark:border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: b.categoryId?.color || '#F43F5E' }}
                      >
                        {b.categoryId?.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {b.categoryId?.name || 'Danh mục'}
                        </h3>
                        <span className="text-xs text-slate-400">
                          Tháng {b.month}/{b.year}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteBudget(b._id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">
                        Đã chi: <strong className="text-slate-900 dark:text-white">{formatVND(b.spentAmount, showAmount)}</strong>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Hạn mức: <strong className="text-slate-900 dark:text-white">{formatVND(b.limitAmount, showAmount)}</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      ></div>
                    </div>

                    {/* Status & Warning Text */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      {isExceeded ? (
                        <span className="text-rose-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Vượt hạn mức {formatVND(Math.abs(b.remaining), showAmount)}!
                        </span>
                      ) : isWarning ? (
                        <span className="text-amber-500 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Sắp vượt hạn mức! Còn lại {formatVND(b.remaining, showAmount)}
                        </span>
                      ) : (
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Còn lại {formatVND(b.remaining, showAmount)}
                        </span>
                      )}
                      <span className="font-bold text-slate-700 dark:text-slate-300">{b.percentage}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Budget Modal */}
        {isAddBudgetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thêm Ngân Sách Danh Mục</h3>
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Chọn Danh Mục Chi Tiêu</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hạn Mức Ngân Sách (VNĐ)</label>
                  <input
                    type="number"
                    value={limitAmount}
                    onChange={(e) => setLimitAmount(e.target.value)}
                    placeholder="3.000.000"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBudgetOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md"
                  >
                    Lưu Hạn Mức
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBudgets}
      />
    </div>
  );
};
