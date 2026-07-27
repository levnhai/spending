import React, { useState } from 'react';
import { X, User, DollarSign, Calendar, Wallet as WalletIcon, Phone, FileText } from 'lucide-react';
import { debtApi, DebtType } from '@/entities/debt/debtApi';
import { Wallet } from '@/entities/wallet/walletApi';
import { formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';

interface AddDebtModalProps {
  isOpen: boolean;
  wallets: Wallet[];
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: DebtType;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({
  isOpen,
  wallets,
  onClose,
  onSuccess,
  defaultType = 'LENT',
}) => {
  const [type, setType] = useState<DebtType>(defaultType);
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [walletId, setWalletId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setType(defaultType);
    setPersonName('');
    setPhone('');
    setAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setWalletId('');
    setNotes('');
  };

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFormattedNumber(amount);
    if (!personName.trim()) {
      alert('Vui lòng nhập tên người vay / cho vay');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ lớn hơn 0');
      return;
    }

    try {
      setLoading(true);
      await debtApi.create({
        type,
        personName: personName.trim(),
        phone: phone.trim() || undefined,
        amount: numAmount,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        walletId: walletId || undefined,
        notes: notes.trim() || undefined,
      });

      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo khoản nợ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Thêm Khoản Nợ / Cho Mượn Mới
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('LENT')}
              className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                type === 'LENT'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cho Mượn (Nợ Tôi)
            </button>

            <button
              type="button"
              onClick={() => setType('BORROWED')}
              className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                type === 'BORROWED'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tôi Đi Vay (Tôi Nợ)
            </button>
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Tên Người {type === 'BORROWED' ? 'Cho Vay' : 'Mượn Tiền'} *
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="VD: Anh Tuấn, Bạn Nam..."
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Số Tiền (VNĐ) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(formatNumberWithSpaces(e.target.value))}
              placeholder="VD: 7 400 000"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              Số Điện Thoại (Tùy chọn)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0987654321"
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Ngày Mượn
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Hạn Hẹn Trả (Tùy chọn)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Linked Wallet */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <WalletIcon className="w-3.5 h-3.5" />
              {type === 'BORROWED' ? 'Ví Nhận Tiền Vay' : 'Ví Trích Tiền Cho Mượn'} (Tự động cập nhật số dư)
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

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Ghi Chú / Lý Do
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Mượn mua máy tính, hẹn tháng sau trả..."
              className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-none"
            />
          </div>

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
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all ${
                type === 'BORROWED'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
              }`}
            >
              {loading ? 'Đang tạo...' : 'Tạo Khoản Nợ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
