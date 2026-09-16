'use client';

import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, ArrowRight } from 'lucide-react';
import { api } from '@/shared/lib/api';
import { useUserStore } from '@/entities/user/useUserStore';

interface AuthPageViewProps {
  onSuccess: () => void;
}

export const AuthPageView: React.FC<AuthPageViewProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useUserStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.token);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-900 text-white relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative z-10">
        {/* Brand Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-3">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">2H Expense</h1>
          <p className="text-sm text-slate-400 mt-1">Đăng nhập vào hệ thống quản lý chi tiêu</p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Đang xử lý...' : 'Đăng Nhập'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
