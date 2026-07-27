'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/widgets/header/Header';
import { Plus, Trash2, Wallet as WalletIcon, CreditCard, Building, Banknote, ArrowUpRight, ArrowDownLeft, ShieldCheck, Scale } from 'lucide-react';
import { walletApi, Wallet } from '@/entities/wallet/walletApi';
import { debtApi, Debt, DebtType } from '@/entities/debt/debtApi';
import { DebtCard } from '@/entities/debt/ui/DebtCard';
import { AddDebtModal } from '@/features/add-debt/AddDebtModal';
import { RepayDebtModal } from '@/features/repay-debt/RepayDebtModal';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';

export const WalletsPageView: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState<'wallets' | 'lent' | 'borrowed'>('wallets');

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [debtModalDefaultType, setDebtModalDefaultType] = useState<DebtType>('LENT');
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<Debt | null>(null);

  // Form state for creating wallet
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet' | 'credit'>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const fetchData = async () => {
    try {
      const [walletsData, debtsData] = await Promise.all([
        walletApi.getAll(),
        debtApi.getAll(),
      ]);
      setWallets(walletsData);
      setDebts(debtsData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate Overview Stats
  const stats = useMemo(() => {
    const totalWalletBalance = wallets.reduce((sum, w) => sum + (w.currentBalance || 0), 0);

    const totalLentRemaining = debts
      .filter((d) => d.type === 'LENT')
      .reduce((sum, d) => sum + Math.max(0, d.amount - (d.paidAmount || 0)), 0);

    const totalBorrowedRemaining = debts
      .filter((d) => d.type === 'BORROWED')
      .reduce((sum, d) => sum + Math.max(0, d.amount - (d.paidAmount || 0)), 0);

    const netWorth = totalWalletBalance + totalLentRemaining - totalBorrowedRemaining;

    return {
      totalWalletBalance,
      totalLentRemaining,
      totalBorrowedRemaining,
      netWorth,
    };
  }, [wallets, debts]);

  // Wallet creation handler
  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await walletApi.create({
        name,
        type,
        initialBalance: parseFormattedNumber(initialBalance),
        color,
        icon: type === 'bank' ? 'Building' : type === 'cash' ? 'Banknote' : 'Wallet',
      });
      setName('');
      setInitialBalance('');
      setType('bank');
      setColor('#3B82F6');
      setIsAddWalletOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  useEffect(() => {
    if (isAddWalletOpen) {
      setName('');
      setInitialBalance('');
      setType('bank');
      setColor('#3B82F6');
    }
  }, [isAddWalletOpen]);

  const handleDeleteWallet = async (id: string) => {
    if (confirm('Xóa ví này? Các giao dịch thuộc ví cũng sẽ ảnh hưởng.')) {
      try {
        await walletApi.delete(id);
        fetchData();
      } catch (err) {
        alert('Xóa ví thất bại');
      }
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khoản nợ này?')) {
      try {
        await debtApi.delete(id);
        fetchData();
      } catch (err) {
        alert('Xóa khoản nợ thất bại');
      }
    }
  };

  const getWalletIcon = (t: string) => {
    if (t === 'bank') return Building;
    if (t === 'cash') return Banknote;
    if (t === 'credit') return CreditCard;
    return WalletIcon;
  };

  const lentDebts = debts.filter((d) => d.type === 'LENT');
  const borrowedDebts = debts.filter((d) => d.type === 'BORROWED');

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Ví & Quản Lý Nợ / Cho Mượn" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        {/* OVERVIEW STATS BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Worth */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg space-y-1">
            <div className="flex items-center justify-between text-indigo-100 text-xs font-semibold">
              <span>Tài Sản Ròng (Net Worth)</span>
              <Scale className="w-4 h-4 opacity-80" />
            </div>
            <AmountDisplay amount={stats.netWorth} className="text-2xl font-bold tracking-tight" />
            <p className="text-[11px] text-indigo-100/80">=(Tổng ví + Cho mượn) - Tôi nợ</p>
          </div>

          {/* Wallets Balance */}
          <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Tổng Số Dư Trong Ví</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <AmountDisplay amount={stats.totalWalletBalance} className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight" />
            <p className="text-[11px] text-slate-400">Từ {wallets.length} nguồn tiền</p>
          </div>

          {/* Total Lent */}
          <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Tiền Cho Mượn (Nợ Tôi)</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
            <AmountDisplay amount={stats.totalLentRemaining} className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight" />
            <p className="text-[11px] text-slate-400">{lentDebts.length} người đang mượn</p>
          </div>

          {/* Total Borrowed */}
          <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Khoản Đi Vay (Tôi Nợ)</span>
              <ArrowDownLeft className="w-4 h-4 text-amber-500" />
            </div>
            <AmountDisplay amount={stats.totalBorrowedRemaining} className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight" />
            <p className="text-[11px] text-slate-400">{borrowedDebts.length} khoản nợ cần trả</p>
          </div>
        </div>

        {/* TABS CONTROL & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('wallets')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'wallets'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ví & Tài Khoản ({wallets.length})
            </button>

            <button
              onClick={() => setActiveTab('lent')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'lent'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cho Mượn ({lentDebts.length})
            </button>

            <button
              onClick={() => setActiveTab('borrowed')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'borrowed'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tôi Đi Vay ({borrowedDebts.length})
            </button>
          </div>

          {/* Dynamic Action Button */}
          {activeTab === 'wallets' ? (
            <button
              onClick={() => setIsAddWalletOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Ví Mới</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setDebtModalDefaultType(activeTab === 'borrowed' ? 'BORROWED' : 'LENT');
                setIsAddDebtOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md hover:opacity-95 ${
                activeTab === 'borrowed' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-emerald-500 shadow-emerald-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'borrowed' ? 'Thêm Khoản Vay Nợ' : 'Thêm Khoản Cho Mượn'}</span>
            </button>
          )}
        </div>

        {/* CONTENT SECTIONS */}
        {/* TAB 1: WALLETS GRID */}
        {activeTab === 'wallets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((w) => {
              const Icon = getWalletIcon(w.type);
              return (
                <div
                  key={w._id}
                  className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: w.color || '#3B82F6' }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{w.name}</h3>
                        <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                          {w.type === 'cash'
                            ? 'Tiền mặt'
                            : w.type === 'bank'
                            ? 'Ngân hàng'
                            : w.type === 'ewallet'
                            ? 'Ví điện tử'
                            : 'Thẻ tín dụng'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteWallet(w._id)}
                      className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-xs text-slate-400 font-medium block mb-0.5">Số dư khả dụng</span>
                    <AmountDisplay
                      amount={w.currentBalance}
                      className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
                    />
                  </div>
                </div>
              );
            })}

            {wallets.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <WalletIcon className="w-12 h-12 mx-auto stroke-1" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Chưa có ví nào được tạo</p>
                <p className="text-xs">Bấm "Thêm Ví Mới" để tạo ví đầu tiên của bạn</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHO MƯỢN (LENT DEBTS) */}
        {activeTab === 'lent' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lentDebts.map((debt) => (
              <DebtCard
                key={debt._id}
                debt={debt}
                onPayClick={(d) => setSelectedDebtForPay(d)}
                onDeleteClick={handleDeleteDebt}
              />
            ))}

            {lentDebts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <ArrowUpRight className="w-12 h-12 mx-auto stroke-1 text-emerald-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Không có khoản cho mượn nào</p>
                <p className="text-xs">Bấm "Thêm Khoản Cho Mượn" để ghi nhận thông tin người vay tiền bạn</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TÔI ĐI VAY (BORROWED DEBTS) */}
        {activeTab === 'borrowed' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {borrowedDebts.map((debt) => (
              <DebtCard
                key={debt._id}
                debt={debt}
                onPayClick={(d) => setSelectedDebtForPay(d)}
                onDeleteClick={handleDeleteDebt}
              />
            ))}

            {borrowedDebts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <ArrowDownLeft className="w-12 h-12 mx-auto stroke-1 text-amber-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Không có khoản đi vay nào</p>
                <p className="text-xs">Bấm "Thêm Khoản Vay Nợ" để ghi nhận thông tin tiền bạn vay từ người khác</p>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD WALLET */}
        {isAddWalletOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thêm Ví / Tài Khoản Mới</h3>
              <form onSubmit={handleCreateWallet} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tên Ví</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Vietcombank, Momo..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Loại Nguồn Tiền</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="bank" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Ngân hàng</option>
                    <option value="cash" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Tiền mặt</option>
                    <option value="ewallet" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Ví điện tử</option>
                    <option value="credit" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Thẻ tín dụng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Dư Ban Đầu (VNĐ)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(formatNumberWithSpaces(e.target.value))}
                    placeholder="VD: 7 400 000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Màu Sắc Đại Diện</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 rounded-xl cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddWalletOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md"
                  >
                    Tạo Ví
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ADD DEBT */}
        <AddDebtModal
          isOpen={isAddDebtOpen}
          wallets={wallets}
          defaultType={debtModalDefaultType}
          onClose={() => setIsAddDebtOpen(false)}
          onSuccess={fetchData}
        />

        {/* MODAL: REPAY / THU DEBT */}
        <RepayDebtModal
          isOpen={!!selectedDebtForPay}
          debt={selectedDebtForPay}
          wallets={wallets}
          onClose={() => setSelectedDebtForPay(null)}
          onSuccess={fetchData}
        />
      </main>

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};
