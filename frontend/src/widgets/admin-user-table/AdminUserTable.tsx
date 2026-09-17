'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShoppingBag,
  User,
  Trash2,
  Lock,
  Unlock,
  Calendar,
  MoreVertical,
  Check,
  AlertTriangle,
  Pencil,
  Eye,
} from 'lucide-react';
import { AdminUser, AdminRoleType, adminApi } from '@/entities/admin';
import { EditUserModal, UserDetailModal } from '@/features/admin-user-management';

interface AdminUserTableProps {
  users: AdminUser[];
  loading: boolean;
  onRefresh: () => void;
  currentUserId?: string;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({
  users,
  loading,
  onRefresh,
  currentUserId,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userToViewDetail, setUserToViewDetail] = useState<AdminUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: AdminRoleType) => {
    setActionError(null);
    setUpdatingId(userId);
    try {
      await adminApi.updateRole(userId, newRole);
      onRefresh();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Không thể đổi vai trò');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setActionError(null);
    setUpdatingId(userId);
    try {
      await adminApi.updateStatus(userId, !currentStatus);
      onRefresh();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await adminApi.deleteUser(userToDelete.id);
      setUserToDelete(null);
      onRefresh();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Không thể xóa người dùng');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: AdminRoleType) => {
    switch (role) {
      case 'ADMIN':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          label: 'Quản Trị Viên',
          icon: ShieldCheck,
        };
      case 'SALES':
        return {
          bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          label: 'Bán Hàng',
          icon: ShoppingBag,
        };
      default:
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          label: 'Cá Nhân',
          icon: User,
        };
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d);
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-800/40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-slate-400 hover:text-white text-xs font-semibold ml-2"
          >
            Đóng
          </button>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Người dùng</th>
                <th className="py-4 px-6">Vai trò</th>
                <th className="py-4 px-6">Gói & Thời hạn</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Ngày tạo</th>
                <th className="py-4 px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Không tìm thấy người dùng phù hợp</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleConfig = getRoleBadge(u.role);
                  const RoleIcon = roleConfig.icon;
                  const isCurrent = u.id === currentUserId;
                  const isBusy = updatingId === u.id;

                  const isForever = u.role === 'ADMIN' || !u.subscriptionExpiresAt;
                  const isExp = u.isExpired || (u.daysRemaining !== null && u.daysRemaining !== undefined && u.daysRemaining < 0);
                  const isNearExp = !isExp && u.daysRemaining !== null && u.daysRemaining !== undefined && u.daysRemaining <= 7;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* Người dùng */}
                      <td className="py-4 px-6">
                        <div 
                          onClick={() => setUserToViewDetail(u)}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 group-hover:border-purple-500 flex items-center justify-center font-bold text-sm text-emerald-400 shrink-0 shadow-sm transition-colors">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.fullName}
                                className="w-full h-full rounded-2xl object-cover"
                              />
                            ) : (
                              (u.fullName || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                                {u.fullName}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Vai trò (Role Selector) */}
                      <td className="py-4 px-6">
                        <div className="relative inline-block">
                          <select
                            disabled={isBusy}
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as AdminRoleType)
                            }
                            className={`text-xs font-semibold py-1.5 px-3 rounded-xl border bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer transition-colors ${roleConfig.bg}`}
                          >
                            <option value="PERSONAL" className="bg-slate-900 text-slate-200">
                              Cá Nhân (Personal)
                            </option>
                            <option value="SALES" className="bg-slate-900 text-slate-200">
                              Bán Hàng (Sales)
                            </option>
                            <option value="ADMIN" className="bg-slate-900 text-slate-200">
                              Quản Trị Viên (Admin)
                            </option>
                          </select>
                        </div>
                      </td>

                      {/* Gói & Thời Hạn */}
                      <td className="py-4 px-6">
                        {isForever ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[11px] font-bold">
                            <span>Vĩnh viễn</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isExp
                                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                    : isNearExp
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                }`}
                              >
                                {isExp
                                  ? 'Đã hết hạn'
                                  : isNearExp
                                  ? `Còn ${u.daysRemaining} ngày`
                                  : `Còn ${u.daysRemaining} ngày`}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDate(u.subscriptionExpiresAt || '')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {(u.monthlyPrice || 0).toLocaleString('vi-VN')} ₫/tháng
                              {u.subscriptionMonths ? ` • Gói ${u.subscriptionMonths} tháng` : ''}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Trạng thái (Active / Blocked Toggle) */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          disabled={isBusy || isCurrent}
                          onClick={() => handleStatusToggle(u.id, u.isActive)}
                          title={isCurrent ? 'Không thể tự khóa tài khoản của bạn' : 'Bấm để đổi trạng thái'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            u.isActive
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                          } ${isCurrent ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                            }`}
                          />
                          <span>{u.isActive ? 'Hoạt động' : 'Bị khóa'}</span>
                        </button>
                      </td>

                      {/* Ngày tạo */}
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          <span>{formatDate(u.createdAt)}</span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setUserToViewDetail(u)}
                            title="Xem chi tiết thông tin, khách hàng, doanh thu"
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setUserToEdit(u)}
                            title="Gia hạn & Chỉnh sửa thông tin"
                            className="p-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || isCurrent}
                            onClick={() => setUserToDelete(u)}
                            title={isCurrent ? 'Không thể tự xóa chính mình' : 'Xóa tài khoản'}
                            className={`p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ${
                              isCurrent ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi Tiết Người Dùng (3 Tabs: Thông tin, Khách hàng, Doanh thu) */}
      <UserDetailModal
        isOpen={!!userToViewDetail}
        user={userToViewDetail}
        onClose={() => setUserToViewDetail(null)}
        onEditUser={(u) => {
          setUserToViewDetail(null);
          setUserToEdit(u);
        }}
      />

      {/* Modal Chỉnh Sửa Người Dùng */}
      <EditUserModal
        isOpen={!!userToEdit}
        user={userToEdit}
        currentUserId={currentUserId}
        onClose={() => setUserToEdit(null)}
        onSuccess={() => {
          setUserToEdit(null);
          onRefresh();
        }}
      />

      {/* Modal Xác nhận Xóa */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-center font-bold text-base text-white mb-1">
              Xóa người dùng?
            </h3>
            <p className="text-center text-xs text-slate-400 mb-6">
              Bạn có chắc chắn muốn xóa tài khoản{' '}
              <strong className="text-white">{userToDelete.fullName}</strong> ({userToDelete.email})? Hành động này không thể hoàn tác.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
