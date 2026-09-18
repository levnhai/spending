'use client';

import React, { useEffect, useState } from 'react';
import {
  Customer,
  CustomerWithOrders,
  customerApi,
  CUSTOMER_GROUP_CONFIG,
} from '@/entities/customer';
import { ORDER_STATUS_CONFIG } from '@/entities/order';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Package,
  ExternalLink,
  Edit2,
  RefreshCw,
  FileText,
  Tag,
  CheckCircle2,
} from 'lucide-react';

const FacebookIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
      clipRule="evenodd"
    />
  </svg>
);

interface CustomerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  onEdit: (customer: Customer) => void;
  onRefreshList: () => void;
}

const formatVND = (val: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

const formatDate = (d?: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  isOpen,
  onClose,
  customerId,
  onEdit,
  onRefreshList,
}) => {
  const [data, setData] = useState<CustomerWithOrders | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerDetails(customerId);
    } else {
      setData(null);
    }
  }, [isOpen, customerId]);

  const loadCustomerDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await customerApi.getById(id);
      setData(res);
    } catch (err) {
      console.error('Failed to load customer details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncStats = async () => {
    if (!customerId) return;
    try {
      setSyncing(true);
      await customerApi.syncStats(customerId);
      await loadCustomerDetails(customerId);
      onRefreshList();
    } catch (err) {
      console.error('Failed to sync stats', err);
    } finally {
      setSyncing(false);
    }
  };

  const customer = data?.customer;
  const orders = data?.relatedOrders || [];

  const dynamicStats = React.useMemo(() => {
    if (!orders || orders.length === 0) {
      const spent = customer?.totalSpent || 0;
      const debt = customer?.debtAmount || 0;
      return {
        totalSpent: spent,
        debtAmount: debt,
        paidAmount: Math.max(0, spent - debt),
        totalOrders: customer?.totalOrders || 0,
      };
    }

    let spent = 0;
    let paid = 0;
    let debt = 0;
    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');

    const custNameNorm = customer?.name?.trim().toLowerCase();
    const custPhoneNorm = customer?.phone?.trim();
    const custFbNorm = customer?.facebookUrl?.trim().toLowerCase();

    for (const order of activeOrders) {
      const matched = (order.customers || []).filter((c) => {
        const cn = c.name?.trim().toLowerCase();
        const cp = c.phone?.trim();
        const cf = c.facebookUrl?.trim().toLowerCase();
        return (
          (custNameNorm && cn === custNameNorm) ||
          (custPhoneNorm && cp && cp === custPhoneNorm) ||
          (custFbNorm && cf && cf === custFbNorm)
        );
      });

      if (matched.length > 0) {
        let oCustSpent = 0;
        let oCustPaid = 0;
        for (const m of matched) {
          oCustSpent += m.amount || 0;
          oCustPaid += m.paidAmount || 0;
        }
        spent += oCustSpent;
        paid += oCustPaid;
        debt += Math.max(0, oCustSpent - oCustPaid);
      } else {
        const orderTotal = order.totalAmount || 0;
        const orderPaid = order.paidAmount || 0;
        spent += orderTotal;
        paid += orderPaid;
        debt += Math.max(0, orderTotal - orderPaid);
      }
    }

    return {
      totalSpent: spent,
      paidAmount: paid,
      debtAmount: debt,
      totalOrders: activeOrders.length,
    };
  }, [orders, customer]);

  const groupConf = customer?.group
    ? CUSTOMER_GROUP_CONFIG[customer.group]
    : CUSTOMER_GROUP_CONFIG.RETAIL;
  const hasDebt = dynamicStats.debtAmount > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Top bar header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-emerald-500/20">
              {customer?.name ? customer.name.charAt(0).toUpperCase() : 'K'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {customer?.name || 'Chi tiết khách hàng'}
                </h3>
                {customer && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${groupConf.bg} ${groupConf.text} ${groupConf.border}`}
                  >
                    {groupConf.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Mã khách: <span className="font-mono">{customer?._id?.slice(-6).toUpperCase()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {customer && (
              <>
                <button
                  type="button"
                  onClick={handleSyncStats}
                  disabled={syncing}
                  className="p-2 rounded-xl text-slate-500 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  title="Đồng bộ lại công nợ từ các đơn"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(customer)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/20"
                  title="Sửa thông tin khách hàng"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Đang tải hồ sơ khách hàng...</p>
            </div>
          ) : customer ? (
            <>
              {/* Thống kê Tài chính nhanh */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Tổng Hàng
                  </span>
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {formatVND(dynamicStats.totalSpent)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {dynamicStats.totalOrders} đơn
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border shadow-sm ${
                    hasDebt
                      ? 'bg-rose-50/70 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Công Nợ
                  </span>
                  <div
                    className={`text-base sm:text-lg font-bold ${
                      hasDebt ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {formatVND(dynamicStats.debtAmount)}
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {hasDebt ? 'Chưa thanh toán' : 'Đã thanh toán đủ'}
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Đã Thu Về
                  </span>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVND(dynamicStats.paidAmount)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">Thực nhận</span>
                </div>
              </div>

              {/* Thông tin liên hệ & Địa chỉ */}
              <div className="bg-slate-50/70 dark:bg-slate-800/30 rounded-2xl border border-slate-200/70 dark:border-slate-800 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Thông Tin Liên Lạc & Giao Hàng
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-400">SĐT:</span>
                      <a href={`tel:${customer.phone}`} className="font-semibold text-emerald-600 hover:underline">
                        {customer.phone}
                      </a>
                    </div>
                  )}

                  {customer.zaloPhone && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-teal-500 shrink-0" />
                      <span className="text-slate-400">Zalo:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {customer.zaloPhone}
                      </span>
                    </div>
                  )}

                  {customer.facebookUrl && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <FacebookIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-slate-400">Facebook:</span>
                      <a
                        href={customer.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-500 hover:underline flex items-center gap-1 truncate"
                      >
                        <span className="truncate">{customer.facebookUrl}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="text-slate-400 shrink-0">Địa chỉ:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {customer.address}
                      </span>
                    </div>
                  )}
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    {customer.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {customer.note && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-xs">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-500">Ghi chú riêng của Sales: </span>
                      <span className="text-slate-700 dark:text-slate-300">{customer.note}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lịch sử Đơn Hàng */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-500" />
                    <span>Lịch Sử Mua Hàng ({orders.length} đơn)</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    Gần nhất: {formatDate(customer.lastOrderDate)}
                  </span>
                </div>

                {orders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400">Khách hàng chưa có đơn hàng nào ghi nhận.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {orders.map((order) => {
                      const statusConf =
                        ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.ORDERED;
                      return (
                        <div
                          key={order._id}
                          className="bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-3.5 shadow-sm hover:border-emerald-500/40 transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                {order.orderCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                              >
                                {statusConf.label}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {order.title}
                            </p>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.orderDate || order.createdAt)}
                            </span>
                          </div>

                          {(() => {
                            const isCompleted = order.status === "COMPLETED";
                            const tot = order.totalAmount || 0;
                            const paid = isCompleted ? tot : (order.paidAmount || 0);
                            const rem = isCompleted ? 0 : Math.max(0, tot - paid);

                            return (
                              <div className="text-right shrink-0">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {formatVND(tot)}
                                </div>
                                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  Đã thu: {formatVND(paid)}
                                </div>
                                {rem > 0 && (
                                  <div className="text-[10px] font-bold text-rose-500">
                                    Nợ: {formatVND(rem)}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              Không tìm thấy khách hàng
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
