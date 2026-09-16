'use client';

import React from 'react';
import { Customer, CustomerGroupType, CUSTOMER_GROUP_CONFIG } from '@/entities/customer';
import {
  Phone,
  MessageCircle,
  MapPin,
  ExternalLink,
  Eye,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Users,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useUserStore } from '@/entities/user/useUserStore';
import { formatVND } from '@/shared/lib/formatters';

interface CustomerTableProps {
  customers: Customer[];
  loading?: boolean;
  onViewDetails: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onSync: (customer: Customer) => void;
  onAddNew?: () => void;
}

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
      clipRule="evenodd"
    />
  </svg>
);

const formatDate = (d?: string | null) => {
  if (!d) return 'Chưa có đơn';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getAvatarGradient = (group: CustomerGroupType) => {
  switch (group) {
    case 'VIP':
      return 'from-amber-400 via-amber-500 to-yellow-600 shadow-amber-500/20';
    case 'REGULAR':
      return 'from-blue-500 to-indigo-600 shadow-blue-500/20';
    case 'WHOLESALE':
      return 'from-purple-500 to-violet-600 shadow-purple-500/20';
    case 'BAD_DEBT':
      return 'from-rose-500 to-red-600 shadow-rose-500/20';
    case 'RETAIL':
    default:
      return 'from-emerald-500 to-teal-600 shadow-emerald-500/20';
  }
};

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  loading,
  onViewDetails,
  onEdit,
  onDelete,
  onSync,
  onAddNew,
}) => {
  const showAmount = useUserStore((s) => s.showAmount);
  const renderAmount = (val: number) => (showAmount ? formatVND(val) : '••••••••');

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Đang tải danh sách khách hàng...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-10 text-center flex flex-col items-center justify-center shadow-sm">
        <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 shadow-inner">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">
          Chưa có khách hàng nào
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
          Hãy thêm khách hàng đầu tiên để quản lý thông tin liên hệ, theo dõi công nợ và lịch sử mua hàng.
        </p>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khách Hàng Ngay</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <th className="py-3.5 pl-6 pr-4">Khách Hàng</th>
                <th className="py-3.5 px-4">Liên Hệ</th>
                <th className="py-3.5 px-4 text-right">Tổng Chi Tiêu (LTV)</th>
                <th className="py-3.5 px-4 text-right">Công Nợ</th>
                <th className="py-3.5 px-4 text-center">Mua Gần Nhất</th>
                <th className="py-3.5 pr-6 pl-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
              {customers.map((c) => {
                const groupConf = CUSTOMER_GROUP_CONFIG[c.group] || CUSTOMER_GROUP_CONFIG.RETAIL;
                const hasDebt = (c.debtAmount || 0) > 0;

                return (
                  <tr
                    key={c._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* KHÁCH HÀNG */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                            c.group
                          )} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}
                        >
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => onViewDetails(c)}
                              className="font-bold text-slate-800 dark:text-slate-100 text-sm hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer transition-colors truncate"
                            >
                              {c.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${groupConf.bg} ${groupConf.text} ${groupConf.border}`}
                            >
                              {groupConf.label}
                            </span>
                          </div>
                          {c.tags && c.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* LIÊN HỆ */}
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      <div className="space-y-1">
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1.5 text-xs hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors font-semibold"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{c.phone}</span>
                          </a>
                        )}
                        <div className="flex items-center gap-2">
                          {c.facebookUrl && (
                            <a
                              href={c.facebookUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-[11px]"
                              title="Mở Facebook"
                            >
                              <FacebookIcon className="w-3.5 h-3.5" />
                              <span className="max-w-[120px] truncate">Facebook</span>
                            </a>
                          )}
                          {c.zaloPhone && (
                            <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1 text-[11px]">
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Zalo: {c.zaloPhone}</span>
                            </span>
                          )}
                        </div>
                        {c.address && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 max-w-[200px] truncate" title={c.address}>
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{c.address}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* TỔNG CHI TIÊU */}
                    <td className="py-4 px-4 text-right">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {renderAmount(c.totalSpent || 0)}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {c.totalOrders || 0} đơn hàng
                      </div>
                    </td>

                    {/* CÔNG NỢ */}
                    <td className="py-4 px-4 text-right">
                      {hasDebt ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="font-bold text-rose-500 dark:text-rose-400 text-sm">
                            {renderAmount(c.debtAmount)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Còn nợ
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">0 ₫</span>
                      )}
                    </td>

                    {/* NGÀY MUA GẦN NHẤT */}
                    <td className="py-4 px-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                      <div className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(c.lastOrderDate)}</span>
                      </div>
                    </td>

                    {/* THAO TÁC */}
                    <td className="py-4 pr-6 pl-4 text-right">
                      <div className="inline-flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewDetails(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Xem chi tiết 360°"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSync(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                          title="Đồng bộ lại công nợ từ đơn"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE LIST VIEW (Minimal, Clean, Apple-Style List) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-2.5">
        {customers.map((c) => {
          const groupConf = CUSTOMER_GROUP_CONFIG[c.group] || CUSTOMER_GROUP_CONFIG.RETAIL;
          const hasDebt = (c.debtAmount || 0) > 0;

          return (
            <div
              key={c._id}
              onClick={() => onViewDetails(c)}
              className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 active:scale-[0.99] transition-all shadow-sm"
            >
              {/* Left: Round Avatar + Name + Group + Phone */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarGradient(
                    c.group
                  )} text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0`}
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                      {c.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${groupConf.bg} ${groupConf.text} ${groupConf.border}`}
                    >
                      {groupConf.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 dark:text-slate-400 font-medium">
                    {c.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-500" />
                        <span>{c.phone}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Chưa có SĐT</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Debt / Total Spent + Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  {hasDebt ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 font-extrabold text-xs border border-rose-500/20">
                        Nợ {renderAmount(c.debtAmount)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {c.totalOrders || 0} đơn mua
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex flex-col items-end">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {renderAmount(c.totalSpent || 0)}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-medium mt-0.5">
                        {c.totalOrders || 0} đơn • Sạch nợ
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
