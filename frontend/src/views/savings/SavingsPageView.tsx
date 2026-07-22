'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { Plus, Trash2, Target, PiggyBank, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { goalApi, SavingsGoal } from '@/entities/savings-goal/goalApi';
import { formatVND, formatDate } from '@/shared/lib/formatters';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { useUserStore } from '@/entities/user/useUserStore';

export const SavingsPageView: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const showAmount = useUserStore((s) => s.showAmount);

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const fetchGoals = async () => {
    try {
      const data = await goalApi.getAll();
      setGoals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await goalApi.create({
        title,
        targetAmount: Number(targetAmount),
        currentAmount: Number(initialAmount) || 0,
        deadline: deadline || undefined,
      });
      setTitle('');
      setTargetAmount('');
      setInitialAmount('');
      setDeadline('');
      setIsAddGoalOpen(false);
      fetchGoals();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId || !depositAmount) return;
    try {
      await goalApi.deposit(depositGoalId, Number(depositAmount));
      setDepositAmount('');
      setDepositGoalId(null);
      fetchGoals();
    } catch (e) {
      alert('Nạp tiền thất bại');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Xóa mục tiêu tiết kiệm này?')) {
      try {
        await goalApi.delete(id);
        fetchGoals();
      } catch (e) {
        alert('Xóa thất bại');
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Mục Tiêu Tiết Kiệm Tài Chính" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Danh Sách Mục Tiêu Tiết Kiệm</h2>
            <p className="text-xs text-slate-400">Mua laptop, du lịch, quỹ dự phòng khẩn cấp...</p>
          </div>

          <button
            onClick={() => setIsAddGoalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mục Tiêu</span>
          </button>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm glass-card rounded-3xl">
            Chưa có mục tiêu tiết kiệm nào. Bấm "Thêm Mục Tiêu" để bắt đầu tích lũy!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((g) => (
              <div
                key={g._id}
                className={`p-6 rounded-3xl glass-card border space-y-4 transition-all ${
                  g.isCompleted
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{g.title}</h3>
                      {g.deadline && (
                        <span className="text-xs text-slate-400">Hạn: {formatDate(g.deadline)}</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteGoal(g._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Đã tích lũy: <strong className="text-emerald-500">{formatVND(g.currentAmount, showAmount)}</strong>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Mục tiêu: <strong className="text-slate-900 dark:text-white">{formatVND(g.targetAmount, showAmount)}</strong>
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, g.percentage)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    {g.isCompleted ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Hoàn thành mục tiêu!
                      </span>
                    ) : (
                      <span className="text-slate-400">Còn thiếu {formatVND(Math.max(0, g.targetAmount - g.currentAmount), showAmount)}</span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">{g.percentage}%</span>
                  </div>
                </div>

                {/* Deposit action */}
                {!g.isCompleted && (
                  <button
                    onClick={() => setDepositGoalId(g._id)}
                    className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                  >
                    <PiggyBank className="w-4 h-4" />
                    <span>Nạp Tiền Tích Lũy</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Deposit Modal */}
        {depositGoalId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nạp Tiền Vào Mục Tiêu</h3>
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tiền Nạp (VNĐ)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="1.000.000"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDepositGoalId(null)}
                    className="px-4 py-2 text-slate-500 font-semibold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md"
                  >
                    Xác Nhận Nạp
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {isAddGoalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tạo Mục Tiêu Tiết Kiệm Mới</h3>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tên Mục Tiêu</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Mua Laptop Gaming, Du lịch..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tiền Mục Tiêu (VNĐ)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="30.000.000"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tiền Đã Có Ban Đầu (Tùy chọn)</label>
                  <input
                    type="number"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Hạn Hoàn Thành (Tùy chọn)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddGoalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md"
                  >
                    Tạo Mục Tiêu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={fetchGoals}
      />
    </div>
  );
};
