'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  Users,
  BarChart3,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Header } from '@/widgets/header/Header';
import { AdminStatsCards } from '@/widgets/admin-stats';
import { AdminUserTable } from '@/widgets/admin-user-table';
import { CreateUserModal } from '@/features/admin-user-management';
import { adminApi, AdminStats, AdminUser, AdminRoleType } from '@/entities/admin';
import { useUserStore } from '@/entities/user/useUserStore';

export const AdminPageView: React.FC = () => {
  const { user } = useUserStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'stats'>('all');

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter !== 'ALL' ? (roleFilter as AdminRoleType) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as 'active' | 'blocked') : undefined,
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to load admin users', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [search, roleFilter, statusFilter]);

  const handleRefreshAll = () => {
    fetchStats();
    fetchUsers();
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Debounced search / filter users
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header title="Quản Trị Hệ Thống" />

      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Banner Quản trị viên */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/60 border border-purple-500/20 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>ADMIN CONTROL CENTER</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Bảng Quản Trị & Phân Quyền
              </h1>
              <p className="text-slate-400 text-xs md:text-sm max-w-xl">
                Giám sát người dùng, phân quyền các chế độ (Cá nhân / Bán hàng / Admin) và theo dõi toàn diện số liệu luân chuyển trong hệ thống.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefreshAll}
                className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
                title="Làm mới toàn bộ dữ liệu"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loadingStats || loadingUsers ? 'animate-spin text-purple-400' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm Người Dùng</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab chuyển đổi chế độ xem */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tổng Quan & Danh Sách</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chỉ Số Thống Kê</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quản Lý Người Dùng ({users.length})</span>
          </button>
        </div>

        {/* Stats Section */}
        {(activeTab === 'all' || activeTab === 'stats') && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chỉ Số Toàn Hệ Thống
            </h2>
            <AdminStatsCards stats={stats} loading={loadingStats} />
          </section>
        )}

        {/* User Management Section */}
        {(activeTab === 'all' || activeTab === 'users') && (
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Danh Sách Tài Khoản Người Dùng
              </h2>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Box */}
                <div className="relative min-w-[220px] flex-1 md:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, email..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                      roleFilter === 'ALL'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('PERSONAL')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                      roleFilter === 'PERSONAL'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cá Nhân
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('SALES')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                      roleFilter === 'SALES'
                        ? 'bg-orange-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bán Hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('ADMIN')}
                    className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
                      roleFilter === 'ADMIN'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Admin
                  </button>
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="blocked">Đã bị khóa</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <AdminUserTable
              users={users}
              loading={loadingUsers}
              onRefresh={fetchUsers}
              currentUserId={user?.id}
            />
          </section>
        )}
      </main>

      {/* Modal Thêm người dùng */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchStats();
        }}
      />
    </div>
  );
};
