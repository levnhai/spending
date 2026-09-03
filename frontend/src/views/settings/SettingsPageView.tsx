'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Menu as MenuIcon,
  User,
  Palette,
  KeyRound,
  Shield,
  Check,
  Moon,
  Sun,
  Eye,
  EyeOff,
  ShoppingBag,
  ArrowLeftRight,
} from 'lucide-react';
import { Header } from '@/widgets/header/Header';
import { MenuListSettings } from '@/features/menu-settings';
import { useUserStore, UserRoleType } from '@/entities/user/useUserStore';
import { api } from '@/shared/lib/api';

export const SettingsPageView: React.FC = () => {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'menu';

  const { user, setUser, theme, toggleTheme, showAmount, toggleShowAmount, role, switchRole } =
    useUserStore();

  const [activeTab, setActiveTab] = useState<'menu' | 'profile' | 'display'>(
    initialTab as any,
  );

  const userRole = role || user?.role || 'PERSONAL';

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(userRole);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
      setSelectedRole(role || user.role || 'PERSONAL');
    }
  }, [user, role]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', {
        fullName,
        role: selectedRole,
      });
      setUser(res.data);
      switchRole(selectedRole);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật thông tin thất bại');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    setIsChangingPass(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword,
        newPassword,
      });
      setPassSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3000);
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 md:pb-8 space-y-6">
      <Header title="Hệ Thống" />

      <main className="px-4 md:px-8 space-y-6">
        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === 'menu'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MenuIcon className="w-4 h-4" />
            <span>Menu & Điều hướng</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Tài khoản & Vai trò</span>
          </button>

          <button
            onClick={() => setActiveTab('display')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all duration-200 whitespace-nowrap ${
              activeTab === 'display'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Giao diện & Hiển thị</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === 'menu' && (
            <div className="animate-in fade-in duration-200">
              <MenuListSettings />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-200 space-y-6 max-w-2xl">
              {/* User Profile Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-emerald-500/20">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {user?.fullName || 'Người dùng'}
                    </h3>
                    <p className="text-sm text-slate-400">{user?.email}</p>
                    <span
                      className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        userRole === 'SALES'
                          ? 'bg-orange-500/10 text-orange-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {userRole === 'SALES' ? 'Chế độ Bán Hàng' : 'Chế độ Cá Nhân'}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {/* Select Chế độ / Vai trò */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Chế độ sử dụng (Vai trò)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('PERSONAL')}
                        className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                          selectedRole === 'PERSONAL'
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <User className="w-5 h-5 shrink-0" />
                        <div className="text-left text-xs">
                          <p className="font-bold">Cá Nhân</p>
                          <p className="text-[10px] opacity-70">Thu chi, ví, tiết kiệm</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('SALES')}
                        className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                          selectedRole === 'SALES'
                            ? 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <ShoppingBag className="w-5 h-5 shrink-0" />
                        <div className="text-left text-xs">
                          <p className="font-bold">Bán Hàng</p>
                          <p className="text-[10px] opacity-70">Đơn hàng, doanh số</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Email đăng nhập
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-400 text-sm cursor-not-allowed"
                    />
                  </div>

                  {profileSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Cập nhật thông tin và vai trò thành công!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
                  >
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin'}
                  </button>
                </form>
              </div>

              {/* Change Password Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
                  <KeyRound className="w-5 h-5 text-indigo-500" />
                  <span>Đổi mật khẩu</span>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Ít nhất 6 ký tự"
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                      />
                    </div>
                  </div>

                  {passError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-semibold">
                      {passError}
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Đổi mật khẩu thành công!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isChangingPass ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="animate-in fade-in duration-200 space-y-4 max-w-2xl">
              {/* Display & Theme Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-6">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tùy Chọn Giao Diện
                </h3>

                <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Dark Mode */}
                  <div className="flex items-center justify-between pt-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Chế độ tối (Dark Mode)
                        </p>
                        <p className="text-xs text-slate-400">
                          Giao diện hiện tại: {theme === 'dark' ? 'Tối' : 'Sáng'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Show Amount */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                        {showAmount ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          Hiển thị số tiền
                        </p>
                        <p className="text-xs text-slate-400">
                          {showAmount ? 'Hiển thị số tiền' : 'Ẩn số tiền'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={toggleShowAmount}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        showAmount ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showAmount ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
