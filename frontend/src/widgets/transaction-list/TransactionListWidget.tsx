'use client';

import React, { useState } from 'react';
import { Search, Trash2, ArrowRightLeft, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Transaction, transactionApi } from '@/entities/transaction/transactionApi';
import { formatDate } from '@/shared/lib/formatters';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';

interface WidgetProps {
  transactions: Transaction[];
  onRefresh: () => void;
}

export const TransactionListWidget: React.FC<WidgetProps> = ({ transactions, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search ||
      t.note?.toLowerCase().includes(search.toLowerCase()) ||
      t.categoryId?.name.toLowerCase().includes(search.toLowerCase()) ||
      t.walletId?.name.toLowerCase().includes(search.toLowerCase());

    const matchType = selectedType === 'all' || t.type === selectedType;

    return matchSearch && matchType;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này không?')) {
      try {
        await transactionApi.delete(id);
        onRefresh();
      } catch (err) {
        alert('Xóa không thành công');
      }
    }
  };

  return (
    <div className="p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Danh Sách Giao Dịch</h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm cafe, lương, ví..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">Tất cả loại</option>
            <option value="expense">Chi tiêu</option>
            <option value="income">Thu nhập</option>
            <option value="transfer">Chuyển ví</option>
          </select>
        </div>
      </div>

      {/* Transaction List / Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Chưa tìm thấy giao dịch phù hợp
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-x-auto">
          {filtered.map((t) => {
            const isExpense = t.type === 'expense';
            const isIncome = t.type === 'income';
            const isTransfer = t.type === 'transfer';

            return (
              <div
                key={t._id}
                className="py-3.5 px-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm ${
                      isExpense
                        ? 'bg-rose-500/10 text-rose-500'
                        : isIncome
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-indigo-500/10 text-indigo-500'
                    }`}
                  >
                    {isExpense && <ArrowDownCircle className="w-5 h-5" />}
                    {isIncome && <ArrowUpCircle className="w-5 h-5" />}
                    {isTransfer && <ArrowRightLeft className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {isTransfer
                          ? `Chuyển ví: ${t.walletId?.name || ''} ➔ ${t.toWalletId?.name || ''}`
                          : t.categoryId?.name || t.note || 'Giao dịch'}
                      </span>
                      {t.categoryId?.name && !isTransfer && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {t.categoryId.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatDate(t.date)}</span>
                      <span>•</span>
                      <span>{t.walletId?.name || 'Ví'}</span>
                      {t.note && <span>• {t.note}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-4">
                  <AmountDisplay
                    amount={t.amount}
                    prefix={isExpense ? '-' : isIncome ? '+' : ''}
                    className={`font-bold text-base ${
                      isExpense
                        ? 'text-rose-500'
                        : isIncome
                        ? 'text-emerald-500'
                        : 'text-indigo-500'
                    }`}
                  />

                  <button
                    onClick={() => handleDelete(t._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Xóa giao dịch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
