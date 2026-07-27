import React, { useState } from 'react';
import { X, DollarSign, Calendar, Wallet as WalletIcon, FileText, CheckCircle2, History } from 'lucide-react';
import { debtApi, Debt } from '@/entities/debt/debtApi';
import { Wallet } from '@/entities/wallet/walletApi';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';

interface RepayDebtModalProps {
  isOpen: boolean;
  debt: Debt | null;
  wallets: Wallet[];
  onClose: () => void;
  onSuccess: () => void;
}

export const RepayDebtModal: React.FC<RepayDebtModalProps> = ({
  isOpen,
  debt,
  wallets,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [walletId, setWalletId] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setWalletId('');
    setNote('');
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, debt]);

  if (!isOpen || !debt) return null;

  const isBorrowed = debt.type === 'BORROWED';
  const remaining = Math.max(0, debt.amount - debt.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFormattedNumber(amount);

    if (!payAmount || payAmount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán hợp lệ lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      await debtApi.recordPayment(debt._id, {
        amount: payAmount,
        date: date || undefined,
        walletId: walletId || undefined,
        note: note.trim() || undefined,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận thanh toán');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {isBorrowed ? 'Ghi Nhận Trả Nợ' : 'Ghi Nhận Thu Nợ'}
            </h3>
            <p className="text-xs text-slate-400">
              Đối phương: <strong className="text-slate-700 dark:text-slate-200">{debt.personName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Debt Info Card Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <span>Tổng tiền gốc: <AmountDisplay amount={debt.amount} className="font-bold text-slate-700 dark:text-slate-200" /></span>
            <span>Đã thanh toán: <AmountDisplay amount={debt.paidAmount} className="font-bold text-emerald-500" /></span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Số tiền còn lại cần {isBorrowed ? 'trả' : 'thu'}:
            </span>
            <AmountDisplay
              amount={remaining}
              className={`text-lg font-bold ${isBorrowed ? 'text-amber-600' : 'text-emerald-600'}`}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                Số Tiền Thanh Toán Đợt Này (VNĐ) *
              </label>
              <button
                type="button"
                onClick={() => setAmount(formatNumberWithSpaces(remaining))}
                className="text-xs font-semibold text-emerald-500 hover:underline"
              >
                Trả toàn bộ
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatNumberWithSpaces(e.target.value))}
              placeholder={`VD: ${formatNumberWithSpaces(remaining)}`}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Ngày Thực Hiện
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
            />
          </div>

          {/* Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <WalletIcon className="w-3.5 h-3.5" />
              {isBorrowed ? 'Ví Trích Tiền Trả Nợ' : 'Ví Nhận Tiền Thu Nợ'} (Tự động cập nhật số dư)
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">-- Không chọn ví --</option>
              {wallets.map((w) => (
                <option key={w._id} value={w._id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {w.name} ({w.currentBalance.toLocaleString('vi-VN')} đ)
                </option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Ghi Chú Đợt Thanh Toán
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Trả trước 50%, Chuyển khoản ngân hàng..."
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
            />
          </div>

          {/* History of Payments */}
          {debt.payments && debt.payments.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Lịch Sử Các Đợt Thanh Toán ({debt.payments.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {debt.payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                        Đợt {idx + 1}: <AmountDisplay amount={p.amount} className="text-emerald-500" />
                      </span>
                      {p.note && <span className="text-slate-400 italic">"{p.note}"</span>}
                    </div>
                    <span className="text-slate-400">{new Date(p.date).toLocaleDateString('vi-VN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all flex items-center gap-1.5 ${
                isBorrowed
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Đang lưu...' : 'Xác Nhận Thanh Toán'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
