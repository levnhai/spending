'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Clock,
  Calendar,
  CreditCard,
  Users,
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  ExternalLink,
  Edit,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
} from 'lucide-react';
import { adminApi, AdminUser, AdminUserDetail } from '@/entities/admin';

interface UserDetailModalProps {
  isOpen: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onEditUser?: (user: AdminUser) => void;
}

type TabType = 'info' | 'customers' | 'revenue';

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  user,
  onClose,
  onEditUser,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setActiveTab('info');
      fetchUserDetail(user.id);
    } else {
      setDetailData(null);
      setError(null);
    }
  }, [isOpen, user]);

  const fetchUserDetail = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUserDetail(userId);
      setDetailData(data);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Không thể tải thông tin chi tiết người dùng';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const formatDate = (dStr?: string | null) => {
    if (!dStr) return '—';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dStr));
  };

  const formatCurrency = (amount?: number) => {
    return (amount || 0).toLocaleString('vi-VN') + ' ₫';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Quản Trị
          </span>
        );
      case 'SALES':
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" /> Bán Hàng
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Cá Nhân
          </span>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      ORDERED: { label: 'Đã đặt', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      CN_WAREHOUSE: { label: 'Kho Trung', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      VN_WAREHOUSE: { label: 'Kho Việt', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      AT_HOME: { label: 'Nhà', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      COMPLETED: { label: 'Thành công', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      CANCELLED: { label: 'Đã hủy', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    };
    const s = map[status] || { label: status, cls: 'bg-slate-800 text-slate-400' };
    return <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${s.cls}`}>{s.label}</span>;
  };

  const getCustomerGroupBadge = (group: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      VIP: { label: 'Khách VIP', cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      REGULAR: { label: 'Khách quen', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      WHOLESALE: { label: 'Khách sỉ', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      RETAIL: { label: 'Khách lẻ', cls: 'bg-slate-800 text-slate-300 border-slate-700' },
      BAD_DEBT: { label: 'Nợ xấu / Boom', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    };
    const g = map[group] || { label: group, cls: 'bg-slate-800 text-slate-400' };
    return <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${g.cls}`}>{g.label}</span>;
  };

  const u = detailData?.user || user;
  const isForever = u.role === 'ADMIN' || !u.subscriptionExpiresAt;
  const isExpired = !isForever && u.isExpired;
  const customers = detailData?.customers;
  const revenue = detailData?.revenue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/90 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {u.fullName}
                </h2>
                {getRoleBadge(u.role)}
                {u.isActive ? (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Hoạt động
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Đã khóa
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  {u.email}
                </span>
                <span>•</span>
                <span>Ngày tham gia: {formatDate(u.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditUser && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditUser(user);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Chỉnh sửa / Gia hạn</span>
              </button>
            )}
            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông Tin & Thuê Bao</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Khách Hàng ({customers?.total || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('revenue')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'revenue'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Doanh Thu & Hoạt Động</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Đang tải dữ liệu chi tiết...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* TAB 1: THÔNG TIN VÀ THUÊ BAO */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Subscription Card */}
                  <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>Gói Thuê Bao & Thời Hạn Sử Dụng</span>
                      </div>
                      {isForever ? (
                        <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
                          ✨ Vĩnh viễn (Không giới hạn)
                        </span>
                      ) : isExpired ? (
                        <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
                          ⛔ Đã hết hạn (Bị khóa đăng nhập)
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                          ⏳ Còn {u.daysRemaining ?? 0} ngày sử dụng
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="text-[11px] text-slate-400 block mb-1">Thời gian mua</span>
                        <span className="text-sm font-bold text-white">
                          {u.subscriptionMonths ? `${u.subscriptionMonths} tháng` : 'Vĩnh viễn'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="text-[11px] text-slate-400 block mb-1">Đơn giá / tháng</span>
                        <span className="text-sm font-bold text-amber-400">
                          {formatCurrency(u.monthlyPrice)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="text-[11px] text-slate-400 block mb-1">Tổng tiền thanh toán</span>
                        <span className="text-sm font-bold text-emerald-400">
                          {formatCurrency(u.totalAmountPaid)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80">
                        <span className="text-[11px] text-slate-400 block mb-1">Ngày hết hạn</span>
                        <span className="text-sm font-bold text-purple-300">
                          {u.subscriptionExpiresAt ? formatDate(u.subscriptionExpiresAt) : 'Vĩnh viễn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Account Details */}
                  <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Info className="w-4 h-4 text-purple-400" />
                      <span>Thông Tin Tài Khoản</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-slate-400">Mã người dùng (User ID):</span>
                        <div className="font-mono text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800 break-all select-all">
                          {u.id}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400">Địa chỉ Email:</span>
                        <div className="font-medium text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          {u.email}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400">Vai trò mặc định:</span>
                        <div className="font-medium text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span>{u.role === 'ADMIN' ? 'Quản Trị Viên' : u.role === 'SALES' ? 'Chuyên Viên Bán Hàng' : 'Người Dùng Cá Nhân'}</span>
                          {getRoleBadge(u.role)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-slate-400">Trạng thái tài khoản:</span>
                        <div className="font-medium text-white bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                          {u.isActive ? '✅ Đang hoạt động bình thường' : '⛔ Đang bị khóa truy cập'}
                        </div>
                      </div>
                    </div>

                    {/* Hidden Menus */}
                    {detailData?.user.hiddenMenus && detailData.user.hiddenMenus.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-xs text-slate-400 block mb-2">Các menu bị ẩn bởi người dùng:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {detailData.user.hiddenMenus.map((menu) => (
                            <span
                              key={menu}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                            >
                              {menu}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: KHÁCH HÀNG */}
              {activeTab === 'customers' && (
                <div className="space-y-5">
                  {/* Customers Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Tổng số khách hàng</span>
                        <span className="text-lg font-black text-white">{customers?.total || 0}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Tổng giá trị mua (LTV)</span>
                        <span className="text-lg font-black text-emerald-400">
                          {formatCurrency(customers?.totalSpent)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Tổng nợ của khách</span>
                        <span className="text-lg font-black text-rose-400">
                          {formatCurrency(customers?.totalDebt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer List Table */}
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
                    <div className="p-3.5 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
                      <span>Danh Sách Khách Hàng Quản Lý</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        Hiển thị {customers?.list?.length || 0} khách hàng
                      </span>
                    </div>

                    {!customers?.list || customers.list.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 text-xs">
                        Người dùng này chưa có khách hàng nào trong hệ thống.
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 sticky top-0">
                            <tr>
                              <th className="px-4 py-3">Khách hàng</th>
                              <th className="px-3 py-3">Số điện thoại</th>
                              <th className="px-3 py-3">Nhóm</th>
                              <th className="px-3 py-3 text-right">Tổng mua (LTV)</th>
                              <th className="px-3 py-3 text-right">Còn nợ</th>
                              <th className="px-3 py-3">Đơn mua cuối</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-medium">
                            {customers.list.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                                <td className="px-4 py-3 text-white font-semibold">
                                  <div>{c.name}</div>
                                  {c.address && (
                                    <div className="text-[11px] text-slate-500 font-normal truncate max-w-[180px]">
                                      {c.address}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-slate-400">
                                  {c.phone || '—'}
                                </td>
                                <td className="px-3 py-3">
                                  {getCustomerGroupBadge(c.group)}
                                </td>
                                <td className="px-3 py-3 text-right text-emerald-400 font-bold">
                                  {formatCurrency(c.totalSpent)}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  {c.debtAmount > 0 ? (
                                    <span className="text-rose-400 font-bold">
                                      {formatCurrency(c.debtAmount)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">0 ₫</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-slate-400 text-[11px]">
                                  {c.lastOrderDate ? formatDate(c.lastOrderDate) : 'Chưa mua'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DOANH THU & HOẠT ĐỘNG */}
              {activeTab === 'revenue' && (
                <div className="space-y-6">
                  {/* Sales Revenue Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <ShoppingBag className="w-4 h-4 text-orange-400" />
                      <span>Hoạt Động Bán Hàng & Đơn Hàng</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Tổng số đơn hàng</span>
                        <span className="text-lg font-black text-white">
                          {revenue?.sales?.totalOrders || 0}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Tổng doanh thu bán</span>
                        <span className="text-lg font-black text-orange-400">
                          {formatCurrency(revenue?.sales?.totalSalesRevenue)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Tiền khách đã trả</span>
                        <span className="text-lg font-black text-emerald-400">
                          {formatCurrency(revenue?.sales?.totalPaidRevenue)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Lợi nhuận gộp ước tính</span>
                        <span className={`text-lg font-black ${
                          (revenue?.sales?.totalProfit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formatCurrency(revenue?.sales?.totalProfit)}
                        </span>
                      </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
                      <div className="p-3.5 border-b border-slate-800 font-bold text-xs text-slate-300">
                        Đơn Hàng Gần Đây ({revenue?.sales?.recentOrders?.length || 0})
                      </div>

                      {!revenue?.sales?.recentOrders || revenue.sales.recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-xs">
                          Chưa có đơn hàng nào được ghi nhận.
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                          <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 sticky top-0">
                              <tr>
                                <th className="px-4 py-2.5">Mã đơn</th>
                                <th className="px-3 py-2.5">Tên đơn / Hàng</th>
                                <th className="px-3 py-2.5">Ngày đặt</th>
                                <th className="px-3 py-2.5">Trạng thái</th>
                                <th className="px-3 py-2.5 text-right">Tổng tiền</th>
                                <th className="px-3 py-2.5 text-right">Đã thanh toán</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium">
                              {revenue.sales.recentOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-900/40 transition-colors">
                                  <td className="px-4 py-2.5 font-mono text-purple-400 font-bold">
                                    {o.orderCode}
                                  </td>
                                  <td className="px-3 py-2.5 text-white">
                                    {o.title}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400 text-[11px]">
                                    {formatDate(o.orderDate)}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {getOrderStatusBadge(o.status)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold text-orange-400">
                                    {formatCurrency(o.totalAmount)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                                    {formatCurrency(o.paidAmount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Finance Section */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Thu Chi Cá Nhân</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Tổng thu nhập</span>
                        <span className="text-base font-black text-emerald-400">
                          {formatCurrency(revenue?.personal?.totalIncome)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Tổng chi tiêu</span>
                        <span className="text-base font-black text-rose-400">
                          {formatCurrency(revenue?.personal?.totalExpense)}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
                        <span className="text-[11px] text-slate-400 block mb-1">Dòng tiền chênh lệch</span>
                        <span className={`text-base font-black ${
                          (revenue?.personal?.balance || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formatCurrency(revenue?.personal?.balance)}
                        </span>
                      </div>
                    </div>

                    {/* Recent Transactions List */}
                    {revenue?.personal?.recentTransactions && revenue.personal.recentTransactions.length > 0 && (
                      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
                        <div className="p-3.5 border-b border-slate-800 font-bold text-xs text-slate-300">
                          Giao Dịch Gần Đây ({revenue.personal.recentTransactions.length})
                        </div>
                        <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                          {revenue.personal.recentTransactions.map((t) => (
                            <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/40">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                  t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  {t.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div>
                                  <span className="text-white font-semibold">{t.note || (t.type === 'income' ? 'Thu tiền' : 'Chi tiền')}</span>
                                  <span className="text-[11px] text-slate-500 block">{formatDate(t.date)}</span>
                                </div>
                              </div>
                              <span className={`font-bold ${
                                t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                              }`}>
                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
