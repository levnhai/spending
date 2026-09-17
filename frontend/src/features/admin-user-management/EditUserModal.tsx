'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Mail,
  Lock,
  User,
  Shield,
  AlertCircle,
  CheckCircle2,
  UserX,
  Clock,
  Calendar,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { adminApi, AdminRoleType, AdminUser } from '@/entities/admin';

interface EditUserModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  currentUserId,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRoleType>('PERSONAL');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [monthlyPrice, setMonthlyPrice] = useState<string>('0');
  const [expiresAtStr, setExpiresAtStr] = useState<string>('');
  
  // State gia hạn
  const [renewMonths, setRenewMonths] = useState<number>(1);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewSuccessMsg, setRenewSuccessMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setRole(user.role || 'PERSONAL');
      setIsActive(user.isActive !== false);
      setMonthlyPrice((user.monthlyPrice || 0).toLocaleString('vi-VN'));
      setPassword('');
      setError(null);
      setRenewSuccessMsg(null);

      if (user.subscriptionExpiresAt) {
        const d = new Date(user.subscriptionExpiresAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setExpiresAtStr(`${yyyy}-${mm}-${dd}`);
      } else {
        setExpiresAtStr('');
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isSelf = currentUserId === user.id;
  const rawMonthlyPrice = parseInt(monthlyPrice.replace(/\D/g, ''), 10) || 0;

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      setMonthlyPrice('');
      return;
    }
    const num = parseInt(val, 10);
    setMonthlyPrice(num.toLocaleString('vi-VN'));
  };

  const handleQuickRenew = async (months: number) => {
    setError(null);
    setRenewSuccessMsg(null);
    setIsRenewing(true);
    try {
      const res = await adminApi.renewSubscription(user.id, {
        months,
        monthlyPrice: rawMonthlyPrice,
      });
      setRenewSuccessMsg(res.message);
      setIsActive(true);
      if (res.subscriptionExpiresAt) {
        const d = new Date(res.subscriptionExpiresAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setExpiresAtStr(`${yyyy}-${mm}-${dd}`);
      }
      onSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể gia hạn thuê bao';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsRenewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError('Họ và tên và Email không được để trống');
      return;
    }

    if (password.trim() && password.trim().length < 6) {
      setError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    setLoading(true);
    try {
      await adminApi.updateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        isActive,
        monthlyPrice: rawMonthlyPrice,
        subscriptionExpiresAt: expiresAtStr ? new Date(expiresAtStr).toISOString() : undefined,
        password: password.trim() ? password.trim() : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể cập nhật thông tin người dùng';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/20 text-white shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Chỉnh Sửa & Gia Hạn Thuê Bao
            </h2>
            <p className="text-xs text-slate-400">
              Cập nhật thông tin, thời hạn gói và phân quyền tài khoản
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {renewSuccessMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{renewSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Họ và tên
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* New Password (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Đặt lại mật khẩu mới
              </label>
              <span className="text-[11px] text-slate-500 italic">
                (Để trống nếu không đổi)
              </span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới từ 6 ký tự..."
                minLength={6}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vai trò (Role)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('PERSONAL')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                  role === 'PERSONAL'
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Cá Nhân</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('SALES')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                  role === 'SALES'
                    ? 'border-orange-500/80 bg-orange-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4 text-orange-400" />
                <span className="text-xs font-bold">Bán Hàng</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-center text-center gap-1.5 ${
                  role === 'ADMIN'
                    ? 'border-purple-500/80 bg-purple-500/10 text-white font-bold'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">Quản Trị</span>
              </button>
            </div>
            {isSelf && role !== 'ADMIN' && (
              <p className="text-[11px] text-amber-400 mt-1.5">
                ⚠️ Lưu ý: Bạn đang chỉnh sửa tài khoản của chính mình.
              </p>
            )}
          </div>

          {/* Gói thuê bao & Thời hạn sử dụng */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Quản Lý Thời Hạn & Gia Hạn Thuê Bao</span>
              </div>
            </div>

            {/* Quick Renew Buttons */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                ⚡ Gia hạn nhanh thêm thời gian:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 6, 12].slice(0, 4).map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={isRenewing}
                    onClick={() => handleQuickRenew(m)}
                    className="py-2 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+{m} tháng</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Date & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Ngày hết hạn (Tuỳ chỉnh)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={expiresAtStr}
                    onChange={(e) => setExpiresAtStr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Số tiền / tháng (Admin tự nhập)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={monthlyPrice}
                    onChange={handlePriceChange}
                    placeholder="VD: 50.000, 100.000..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-500 font-medium">
                    VNĐ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Trạng thái hoạt động
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'border-emerald-500/80 bg-emerald-500/10 text-emerald-400 font-bold'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span className="text-xs">Đang hoạt động</span>
              </button>

              <button
                type="button"
                disabled={isSelf}
                onClick={() => setIsActive(false)}
                title={isSelf ? 'Bạn không thể tự khóa tài khoản của chính mình' : undefined}
                className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-center gap-2 ${
                  isSelf ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  !isActive
                    ? 'border-rose-500/80 bg-rose-500/10 text-rose-400 font-bold'
                    : 'border-slate-800 bg-slate-800/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserX className="w-4 h-4" />
                <span className="text-xs">Đã khóa</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
