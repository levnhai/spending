'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { walletApi, Wallet } from '@/entities/wallet/walletApi';
import { categoryApi, Category } from '@/entities/category/categoryApi';
import { transactionApi } from '@/entities/transaction/transactionApi';
import { IconMapper } from '@/shared/icons/IconMapper';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTransactionModal: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      walletApi.getAll().then((data) => {
        setWallets(data);
        if (data.length > 0) {
          setWalletId(data[0]._id);
          if (data.length > 1) setToWalletId(data[1]._id);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && type !== 'transfer') {
      categoryApi.getAll(type).then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0]._id);
      });
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFormattedNumber(amount);
    if (!numAmount || numAmount <= 0) return alert('Vui lòng nhập số tiền hợp lệ');
    if (!walletId) return alert('Vui lòng chọn ví');

    setLoading(true);
    try {
      await transactionApi.create({
        walletId,
        toWalletId: type === 'transfer' ? toWalletId : undefined,
        categoryId: type !== 'transfer' ? categoryId : undefined,
        amount: numAmount,
        type,
        date,
        note,
      });
      setAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo giao dịch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full md:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Thêm Giao Dịch Mới</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="p-4 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Chi tiêu</span>
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              type === 'income'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Thu nhập</span>
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              type === 'transfer'
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Chuyển ví</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Số tiền (VNĐ)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatNumberWithSpaces(e.target.value))}
              placeholder="VD: 7 400 000"
              required
              className="w-full text-2xl font-bold px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Wallet selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {type === 'transfer' ? 'Từ Ví' : 'Chọn Ví'}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              >
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.currentBalance.toLocaleString()}đ)
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Đến Ví
                </label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
                >
                  {wallets
                    .filter((w) => w._id !== walletId)
                    .map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.currentBalance.toLocaleString()}đ)
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Danh mục
                </label>
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
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Ngày thực hiện
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Ăn trưa bún chả..."
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:opacity-95 active:scale-98 transition-all"
          >
            {loading ? 'Đang lưu...' : 'Lưu Giao Dịch'}
          </button>
        </form>
      </div>
    </div>
  );
};
