import React from 'react';
import { User, Calendar, Phone, CheckCircle, Clock, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Debt } from '../debtApi';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';

interface DebtCardProps {
  debt: Debt;
  onPayClick: (debt: Debt) => void;
  onDeleteClick: (debtId: string) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({ debt, onPayClick, onDeleteClick }) => {
  const isBorrowed = debt.type === 'BORROWED'; // Tôi nợ
  const remainingAmount = Math.max(0, debt.amount - debt.paidAmount);
  const progressPercentage = Math.min(100, Math.round((debt.paidAmount / debt.amount) * 100));

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN');
  };

  const isOverdue =
    debt.dueDate && debt.status !== 'PAID' && new Date(debt.dueDate) < new Date();

  return (
    <div className="p-6 rounded-3xl glass-card border border-slate-200/80 dark:border-slate-800/80 space-y-4 hover:shadow-xl transition-all relative overflow-hidden">
      {/* Type indicator top border line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 ${
          isBorrowed ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
              isBorrowed ? 'bg-amber-500/90' : 'bg-emerald-500/90'
            }`}
          >
            {isBorrowed ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-400" />
                {debt.personName}
              </h3>
            </div>

            <span
              className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                isBorrowed
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isBorrowed ? 'Tôi đi vay (Cần trả)' : 'Cho mượn (Nợ tôi)'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDeleteClick(debt._id)}
          className="p-2 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-500/10 transition-colors"
          title="Xóa khoản nợ này"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Information Row */}
      <div className="grid grid-cols-2 gap-2 py-2 text-xs text-slate-500 dark:text-slate-400 border-y border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Ngày mượn: <strong className="text-slate-700 dark:text-slate-300">{formatDate(debt.startDate)}</strong></span>
        </div>

        {debt.dueDate && (
          <div className="flex items-center gap-1.5 justify-end">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className={isOverdue ? 'text-rose-500 font-bold' : ''}>
              {isOverdue ? 'Quá hạn: ' : 'Hẹn trả: '}
              <strong>{formatDate(debt.dueDate)}</strong>
            </span>
          </div>
        )}

        {debt.phone && (
          <div className="flex items-center gap-1.5 col-span-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>SĐT: <strong className="text-slate-700 dark:text-slate-300">{debt.phone}</strong></span>
          </div>
        )}

        {debt.notes && (
          <p className="col-span-2 text-slate-400 italic truncate">"{debt.notes}"</p>
        )}
      </div>

      {/* Amounts & Progress */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Số tiền còn lại</span>
            <AmountDisplay
              amount={remainingAmount}
              className={`text-xl font-bold ${
                isBorrowed ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            />
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Tổng gốc: <AmountDisplay amount={debt.amount} className="font-semibold text-slate-700 dark:text-slate-300" /></span>
            <span className="text-xs text-slate-400">Đã trả: <AmountDisplay amount={debt.paidAmount} className="text-slate-500" /></span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isBorrowed ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-2 flex items-center justify-between">
        {debt.status === 'PAID' ? (
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>Đã hoàn tất thanh toán</span>
          </div>
        ) : (
          <button
            onClick={() => onPayClick(debt)}
            className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 ${
              isBorrowed
                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isBorrowed ? 'Ghi Nhận Trả Nợ' : 'Ghi Nhận Thu Nợ'}
          </button>
        )}
      </div>
    </div>
  );
};
