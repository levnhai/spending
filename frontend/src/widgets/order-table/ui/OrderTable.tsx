'use client';

import React, { useState } from 'react';
import {
  Edit2,
  Trash2,
  Phone,
  Calendar,
  Image as ImageIcon,
  Package,
  X,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderStatusType, orderApi, ORDER_STATUS_CONFIG } from '@/entities/order';
import { OrderStatusDropdown } from '@/features/order-management';
import { AmountDisplay } from '@/shared/ui/AmountDisplay';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatVND } from '@/shared/lib/formatters';
import { useUserStore } from '@/entities/user/useUserStore';

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onDeleted: () => void;
  onStatusChanged: (orderId: string, newStatus: OrderStatusType) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading,
  onEdit,
  onDeleted,
  onStatusChanged,
}) => {
  const showAmount = useUserStore((s) => s.showAmount);
  const renderAmount = (val: number) => (showAmount ? formatVND(val) : '••••••••');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeCustomersModal, setActiveCustomersModal] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; code: string; title?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await orderApi.delete(orderToDelete.id);
      setOrderToDelete(null);
      onDeleted();
    } catch (e) {
      alert('Không thể xóa đơn hàng');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Chưa có đơn hàng nào
        </p>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Tạo đơn hàng mới để theo dõi sản phẩm, danh sách khách hàng, link Facebook, tổng tiền, tiền đã thanh toán và công nợ.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="max-h-[620px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                <th className="py-3.5 px-4 text-center w-28">Mã Đơn Hàng</th>
                <th className="py-3.5 px-4 w-16 text-center">Hình Ảnh</th>
                <th className="py-3.5 px-4">Tên Đơn Hàng</th>
                <th className="py-3.5 px-4">Danh Sách Khách Hàng</th>
                <th className="py-3.5 px-4">Ngày Lên Đơn</th>
                <th className="py-3.5 px-4 text-right">Tổng Tiền & Thanh Toán</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái Đơn</th>
                <th className="py-3.5 px-4 text-center w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {orders.map((order) => {
                const custList = order.customers && order.customers.length > 0
                  ? order.customers
                  : [{
                      name: order.customerName || 'Khách lẻ',
                      phone: order.customerPhone,
                      facebookUrl: '',
                      amount: order.totalAmount,
                      paidAmount: order.paidAmount,
                      orderDate: order.orderDate,
                      status: order.status,
                      paymentStatus: order.paymentStatus,
                    }];
                const mainCustomer = custList[0];
                const extraCount = custList.length - 1;

                const orderTotal = Number(order.totalAmount) || 0;
                const orderPaid = Number(order.paidAmount) || 0;
                const orderRemaining = Math.max(0, orderTotal - orderPaid);

                return (
                  <tr
                    key={order._id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* MÃ ĐƠN HÀNG (Thay thế STT) */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shadow-sm inline-block">
                        {order.orderCode}
                      </span>
                    </td>

                    {/* Image */}
                    <td className="py-3.5 px-4 text-center">
                      {order.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(order.imageUrl || null)}
                          className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:opacity-80 transition-opacity inline-block group relative"
                          title="Xem ảnh lớn"
                        >
                          <img
                            src={order.imageUrl}
                            alt={order.title}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                          <ImageIcon className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {order.title}
                      </div>
                      {order.note && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5" title={order.note}>
                          • {order.note}
                        </div>
                      )}
                    </td>

                    {/* Customers List */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {mainCustomer?.name ? mainCustomer.name.charAt(0).toUpperCase() : 'K'}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {mainCustomer?.name}
                        </span>

                        {extraCount > 0 && (
                          <button
                            type="button"
                            onClick={() => setActiveCustomersModal(order)}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full hover:bg-emerald-500/20 transition-colors"
                            title="Bấm để xem chi tiết tất cả khách hàng"
                          >
                            <Users className="w-3 h-3" />
                            <span>+{extraCount} khách khác</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 pl-8 flex-wrap">
                        {mainCustomer?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {mainCustomer.phone}
                          </span>
                        )}
                        {mainCustomer?.facebookUrl && (
                          <a
                            href={mainCustomer.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-0.5 font-medium"
                            title={mainCustomer.facebookUrl}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>FB Link</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Order Date */}
                    <td className="py-3.5 px-4 font-medium text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(order.orderDate || mainCustomer?.orderDate)}</span>
                      </div>
                    </td>

                    {/* Total Amount & Paid Breakdown */}
                    <td className="py-3.5 px-4 text-right">
                      <AmountDisplay
                        amount={orderTotal}
                        className="font-extrabold text-slate-900 dark:text-white text-sm"
                      />
                      <div className="text-[11px] space-x-1.5 mt-0.5">
                        <span className="text-emerald-500 font-semibold">
                          Đã thu: {renderAmount(orderPaid)}
                        </span>
                        {orderRemaining > 0 && (
                          <span className="text-amber-500 font-semibold">
                            | Nợ: {renderAmount(orderRemaining)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4 text-center">
                      <OrderStatusDropdown
                        orderId={order._id}
                        currentStatus={order.status}
                        onStatusChanged={(newStatus) => onStatusChanged(order._id, newStatus)}
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEdit(order)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                          title="Chỉnh sửa đơn hàng"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOrderToDelete({ id: order._id, code: order.orderCode, title: order.title })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Xóa đơn hàng"
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

      {/* MOBILE CARD LIST VIEW */}
      <div className="lg:hidden max-h-[620px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {orders.map((order) => {
          const custList = order.customers && order.customers.length > 0
            ? order.customers
            : [{
                name: order.customerName || 'Khách lẻ',
                phone: order.customerPhone,
                facebookUrl: '',
                amount: order.totalAmount,
                paidAmount: order.paidAmount,
                orderDate: order.orderDate,
                status: order.status,
                paymentStatus: order.paymentStatus,
              }];
          const mainCustomer = custList[0];
          const extraCount = custList.length - 1;

          const orderTotal = Number(order.totalAmount) || 0;
          const orderPaid = Number(order.paidAmount) || 0;
          const orderRemaining = Math.max(0, orderTotal - orderPaid);

          return (
            <div
              key={order._id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Image */}
                  {order.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(order.imageUrl || null)}
                      className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0"
                    >
                      <img
                        src={order.imageUrl}
                        alt={order.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-extrabold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        {order.orderCode}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                      {order.title}
                    </h4>
                  </div>
                </div>

                {/* Status */}
                <OrderStatusDropdown
                  orderId={order._id}
                  currentStatus={order.status}
                  onStatusChanged={(newStatus) => onStatusChanged(order._id, newStatus)}
                />
              </div>

              {/* Customers & Date */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {mainCustomer?.name}
                  </span>
                  {mainCustomer?.facebookUrl && (
                    <a
                      href={mainCustomer.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center gap-0.5 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>FB</span>
                    </a>
                  )}
                  {extraCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveCustomersModal(order)}
                      className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded"
                    >
                      +{extraCount} khách
                    </button>
                  )}
                </div>
                <span>{formatDate(order.orderDate || mainCustomer?.orderDate)}</span>
              </div>

              {/* Price Breakdown & Actions */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-extrabold text-base text-slate-900 dark:text-white">
                    <AmountDisplay
                      amount={orderTotal}
                      className="font-extrabold text-base text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 space-x-1">
                    <span className="text-emerald-500 font-semibold">Đã thu: {renderAmount(orderPaid)}</span>
                    {orderRemaining > 0 && (
                      <span className="text-amber-500 font-semibold">| Nợ: {renderAmount(orderRemaining)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(order)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => setOrderToDelete({ id: order._id, code: order.orderCode, title: order.title })}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MULTIPLE CUSTOMERS FULL DETAILS MODAL */}
      {activeCustomersModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setActiveCustomersModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Chi Tiết Khách Hàng({activeCustomersModal.customers?.length || 1})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Đơn hàng: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeCustomersModal.title}</span> ({activeCustomersModal.orderCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCustomersModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {(activeCustomersModal.customers && activeCustomersModal.customers.length > 0
                ? activeCustomersModal.customers
                : [
                    {
                      name: activeCustomersModal.customerName || 'Khách lẻ',
                      phone: activeCustomersModal.customerPhone,
                      facebookUrl: '',
                      amount: activeCustomersModal.totalAmount,
                      paidAmount: activeCustomersModal.paidAmount,
                      orderDate: activeCustomersModal.orderDate,
                      status: activeCustomersModal.status,
                      paymentStatus: activeCustomersModal.paymentStatus,
                      note: activeCustomersModal.note,
                    },
                  ]
              ).map((cust, i) => {
                const conf = ORDER_STATUS_CONFIG[cust.status || 'ORDERED'] || ORDER_STATUS_CONFIG.ORDERED;
                const cAmount = Number(cust.amount) || 0;
                const cPaid = Number(cust.paidAmount) || 0;
                const cRemaining = Math.max(0, cAmount - cPaid);

                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                              {cust.name}
                            </p>
                            {cust.facebookUrl && (
                              <a
                                href={cust.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20"
                                title="Mở trang Facebook cá nhân"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Facebook</span>
                              </a>
                            )}
                          </div>
                          {cust.phone && (
                            <p className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{cust.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${conf.bg} ${conf.text} ${conf.border}`}
                      >
                        {conf.label}
                      </span>
                    </div>

                    {/* Money Breakdown for this customer */}
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng tiền</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">{renderAmount(cAmount)}</span>
                      </div>
                      <div className="border-x border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Đã trả</span>
                        <span className="font-extrabold text-emerald-500">{renderAmount(cPaid)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Còn nợ</span>
                        <span className={`font-extrabold ${cRemaining > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {renderAmount(cRemaining)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Ngày tạo: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{formatDate(cust.orderDate)}</strong></span>
                      {cust.note && <span className="italic truncate max-w-xs">Ghi chú: {cust.note}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500">
                  Tổng đơn ({activeCustomersModal.customers?.length || 1} khách):
                </span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white ml-2">
                  {renderAmount(activeCustomersModal.totalAmount || 0)}
                </span>
              </div>

              <div className="text-right text-xs">
                <span className="text-emerald-500 font-bold">Đã thu: {renderAmount(activeCustomersModal.paidAmount || 0)}</span>
                {Math.max(0, (activeCustomersModal.totalAmount || 0) - (activeCustomersModal.paidAmount || 0)) > 0 && (
                  <span className="text-amber-500 font-bold ml-2">
                    | Còn nợ: {renderAmount((activeCustomersModal.totalAmount || 0) - (activeCustomersModal.paidAmount || 0))}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Ảnh đơn hàng"
              className="max-h-[80vh] w-auto object-contain rounded-2xl mx-auto"
            />
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(orderToDelete)}
        onClose={() => {
          if (!isDeleting) setOrderToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa đơn hàng"
        message={
          <div>
            Bạn có chắc chắn muốn xóa đơn hàng{' '}
            <strong className="text-rose-500 font-bold">
              {orderToDelete?.code}
            </strong>
            {orderToDelete?.title ? ` (${orderToDelete.title})` : ''}? Thao tác này không thể hoàn tác.
          </div>
        }
        confirmText="Xóa đơn hàng"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
};
