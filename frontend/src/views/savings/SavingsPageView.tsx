'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { Plus, Trash2, Target, PiggyBank, ArrowUpRight, ArrowDownLeft, CheckCircle2, Wallet as WalletIcon } from 'lucide-react';
import { goalApi, SavingsGoal } from '@/entities/savings-goal/goalApi';
import { walletApi, Wallet } from '@/entities/wallet/walletApi';
import { formatVND, formatDate, formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { useUserStore } from '@/entities/user/useUserStore';

export const SavingsPageView: React.FC = () => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  
  // Deposit / Withdraw Modal State
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  const showAmount = useUserStore((s) => s.showAmount);

  // Form create state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const fetchGoals = async () => {
    try {
      const [goalsData, walletsData] = await Promise.all([
        goalApi.getAll(),
        walletApi.getAll(),
      ]);
      setGoals(goalsData);
      const paymentWallets = walletsData.filter((w) => w.type !== 'savings' && !w.isExcludedFromTotal);
      setWallets(paymentWallets);
      if (paymentWallets.length > 0) {
        setSelectedWalletId(paymentWallets[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFormattedNumber(targetAmount);
    const numInitial = parseFormattedNumber(initialAmount) || 0;
    if (!numTarget || numTarget <= 0) return alert('Vui lòng nhập số tiền mục tiêu hợp lệ');

    try {
      await goalApi.create({
        title,
        targetAmount: numTarget,
        currentAmount: numInitial,
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

  const handleOpenTransactionModal = (goalId: string, type: 'deposit' | 'withdraw') => {
    setDepositGoalId(goalId);
    setActionType(type);
    setDepositAmount('');
    setDepositNote('');
    if (wallets.length > 0) {
      setSelectedWalletId(wallets[0]._id);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId) return;
    const numAmount = parseFormattedNumber(depositAmount);
    if (!numAmount || numAmount <= 0) return alert('Vui lòng nhập số tiền hợp lệ');

    try {
      await goalApi.deposit(depositGoalId, {
        amount: numAmount,
        walletId: selectedWalletId || undefined,
        type: actionType,
        note: depositNote,
      });
      setDepositAmount('');
      setDepositNote('');
      setDepositGoalId(null);
      fetchGoals();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Giao dịch thất bại');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Xóa mục tiêu tiết kiệm này? Ví tương ứng cũng sẽ bị xóa.')) {
      try {
        await goalApi.delete(id);
        fetchGoals();
      } catch (e) {
        alert('Xóa thất bại');
      }
    }
  };

  const selectedGoal = goals.find((g) => g._id === depositGoalId);

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Mục Tiêu Tiết Kiệm Tài Chính" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Danh Sách Mục Tiêu Tiết Kiệm</h2>
            <p className="text-xs text-slate-400">Tích lũy tài sản cho mục tiêu cá nhân (Các ví này không tính vào Tổng số dư thanh toán)</p>
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

                {/* Action buttons (Nạp / Rút) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleOpenTransactionModal(g._id, 'deposit')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PiggyBank className="w-4 h-4" />
                    <span>Nạp tiền</span>
                  </button>

                  <button
                    onClick={() => handleOpenTransactionModal(g._id, 'withdraw')}
                    disabled={g.currentAmount <= 0}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-700"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Rút về ví</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deposit / Withdraw Modal */}
        {depositGoalId && selectedGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {actionType === 'deposit' ? 'Nạp Tiền Vào Mục Tiêu' : 'Rút Tiền Về Ví'}
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-500 font-medium">
                  {selectedGoal.title}
                </span>
              </div>

              {/* Action Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActionType('deposit')}
                  className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                    actionType === 'deposit'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Nạp Tiền Tích Lũy
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('withdraw')}
                  className={`py-2 rounded-lg font-semibold text-xs transition-all ${
                    actionType === 'withdraw'
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Rút Về Ví Thanh Toán
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                {/* Select payment wallet */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    {actionType === 'deposit' ? 'Rút Tiền Từ Ví' : 'Nhận Tiền Về Ví'}
                  </label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  >
                    {wallets.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.currentBalance.toLocaleString()}đ)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tiền (VNĐ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(formatNumberWithSpaces(e.target.value))}
                    placeholder="VD: 1 000 000"
                    required
                    className="w-full text-xl font-bold px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Ghi Chú (Tùy chọn)</label>
                  <input
                    type="text"
                    value={depositNote}
                    onChange={(e) => setDepositNote(e.target.value)}
                    placeholder={actionType === 'deposit' ? `Tích lũy cho ${selectedGoal.title}` : `Rút từ ${selectedGoal.title}`}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDepositGoalId(null)}
                    className="px-4 py-2 text-slate-500 font-semibold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all ${
                      actionType === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-500 hover:bg-indigo-600'
                    }`}
                  >
                    {actionType === 'deposit' ? 'Xác Nhận Nạp' : 'Xác Nhận Rút'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {isAddGoalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tạo Mục Tiêu Tiết Kiệm Mới</h3>
              <p className="text-xs text-slate-400">Một ví tiết kiệm riêng biệt sẽ tự động được khởi tạo tương ứng với mục tiêu này.</p>
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
                    type="text"
                    inputMode="numeric"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(formatNumberWithSpaces(e.target.value))}
                    placeholder="30 000 000"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tiền Đã Có Ban Đầu (Tùy chọn)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(formatNumberWithSpaces(e.target.value))}
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
