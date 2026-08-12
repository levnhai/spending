'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/widgets/header/Header';
import { Plus, Trash2, CalendarDays, Receipt, Wallet as WalletIcon } from 'lucide-react';
import { billApi, RecurringBill } from '@/entities/recurring-bill/billApi';
import { walletApi, Wallet } from '@/entities/wallet/walletApi';
import { categoryApi, Category } from '@/entities/category/categoryApi';
import { formatVND } from '@/shared/lib/formatters';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { useUserStore } from '@/entities/user/useUserStore';

export const BillsPageView: React.FC = () => {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const showAmount = useUserStore((s) => s.showAmount);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('5');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const fetchBills = async () => {
    try {
      const data = await billApi.getAll();
      setBills(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBills();
    walletApi.getAll().then((ws) => {
      const paymentWallets = ws.filter((w) => w.type !== 'savings' && !w.isExcludedFromTotal);
      setWallets(paymentWallets);
      if (paymentWallets.length > 0) setWalletId(paymentWallets[0]._id);
    });
    categoryApi.getAll('expense').then((cs) => {
      setCategories(cs);
      if (cs.length > 0) setCategoryId(cs[0]._id);
    });
  }, []);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await billApi.create({
        title,
        amount: Number(amount),
        dueDate: Number(dueDate),
        walletId,
        categoryId,
      });
      setTitle('');
      setAmount('');
      setIsAddBillOpen(false);
      fetchBills();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (confirm('Xóa hóa đơn định kỳ này?')) {
      try {
        await billApi.delete(id);
        fetchBills();
      } catch (e) {
        alert('Xóa thất bại');
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Quản Lý Hóa Đơn Định Kỳ" onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <main className="px-4 md:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Danh Sách Hóa Đơn Lặp Hàng Tháng</h2>
            <p className="text-xs text-slate-400">Tiền điện, nước, internet, tiền nhà, Netflix, Spotify...</p>
          </div>

          <button
            onClick={() => setIsAddBillOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Hóa Đơn</span>
          </button>
        </div>

        {/* Bills Grid */}
        {bills.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm glass-card rounded-3xl">
            Chưa có hóa đơn định kỳ nào được tạo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bills.map((b) => (
              <div
                key={b._id}
                className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:shadow-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{b.title}</h3>
                      <span className="text-xs text-slate-400 font-medium">Hạn thanh toán: Ngày {b.dueDate} hàng tháng</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteBill(b._id)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium block">Số tiền</span>
                    <span className="text-xl font-bold text-rose-500">{formatVND(b.amount, showAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium block">Ví thanh toán</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {b.walletId?.name || 'Mặc định'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Bill Modal */}
        {isAddBillOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Thêm Hóa Đơn Định Kỳ</h3>
              <form onSubmit={handleCreateBill} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tên Hóa Đơn</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Tiền điện tháng, Netflix..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Số Tiền Hàng Tháng (VNĐ)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="250.000"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Ngày Đến Hạn (1-31)</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Ví Trừ Tiền</label>
                    <select
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                    >
                      {wallets.map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Danh Mục Hóa Đơn</label>
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

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBillOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-500 font-semibold text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md"
                  >
                    Tạo Hóa Đơn
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
        onSuccess={fetchBills}
      />
    </div>
  );
};
