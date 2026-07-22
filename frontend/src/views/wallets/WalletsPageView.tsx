'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { Plus, Trash2, Wallet as WalletIcon, CreditCard, Building, Banknote } from 'lucide-react';
import { walletApi, Wallet } from '@/entities/wallet/walletApi';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';

export const WalletsPageView: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet' | 'credit'>('bank');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const fetchWallets = async () => {
    try {
      const data = await walletApi.getAll();
      setWallets(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await walletApi.create({
        name,
        type,
        initialBalance: Number(initialBalance) || 0,
        color,
        icon: type === 'bank' ? 'Building' : type === 'cash' ? 'Banknote' : 'Wallet',
      });
      setName('');
      setInitialBalance('');
      setIsAddWalletOpen(false);
      fetchWallets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteWallet = async (id: string) => {
    if (confirm('Xóa ví này? Các giao dịch thuộc ví cũng sẽ ảnh hưởng.')) {
      try {
        await walletApi.delete(id);
        fetchWallets();
      } catch (err) {
        alert('Xóa ví thất bại');
      }
    }
  };

  const getWalletIcon = (t: string) => {
    if (t === 'bank') return Building;
    if (t === 'cash') return Banknote;
    if (t === 'credit') return CreditCard;
    return WalletIcon;
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Ví & Tài Khoản Nguồn Tiền" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Danh Sách Ví / Tài Khoản</h2>
            <p className="text-xs text-slate-400">Quản lý số dư nguồn tiền cá nhân</p>
          </div>

          <button
            onClick={() => setIsAddWalletOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Ví Mới</span>
          </button>
        </div>

        {/* Grid Wallets */}
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
        </div>

        {/* Add Wallet Modal */}
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  >
                    <option value="bank">Ngân hàng</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="ewallet">Ví điện tử</option>
                    <option value="credit">Thẻ tín dụng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Dư Ban Đầu (VNĐ)</label>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    placeholder="0"
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
      </main>

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={fetchWallets}
      />
    </div>
  );
};
