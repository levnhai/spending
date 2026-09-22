"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Eye,
  MapPin,
  CheckSquare,
  AlertTriangle,
  FileDown,
} from "lucide-react";
import {
  Order,
  OrderStatusType,
  orderApi,
  ORDER_STATUS_CONFIG,
} from "@/entities/order";
import {
  OrderStatusDropdown,
  ExportPdfModal,
  OrderDetailModal,
} from "@/features/order-management";
import { AmountDisplay } from "@/shared/ui/AmountDisplay";
import { ConfirmModal } from "@/shared/ui/ConfirmModal";
import { formatVND } from "@/shared/lib/formatters";
import { useUserStore } from "@/entities/user/useUserStore";
import { getFullImageUrl } from "@/shared/lib/uploadApi";

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onDeleted: (deletedIds?: string | string[]) => void;
  onStatusChanged: (orderId: string, newStatus: OrderStatusType) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

// Component hiển thị thumbnail ảnh đơn hàng chống vỡ ảnh
const OrderThumbnail: React.FC<{
  src?: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
}> = ({ src, alt, onClick, className = 'w-11 h-11' }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0 shadow-sm`}
      >
        <Package className="w-5 h-5 opacity-70" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${className} rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 shrink-0 hover:opacity-85 active:scale-95 transition-all shadow-sm group relative`}
      title="Xem ảnh lớn"
    >
      <img
        src={getFullImageUrl(src)}
        alt={alt || 'Sản phẩm'}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </button>
  );
};

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading,
  onEdit,
  onDeleted,
  onStatusChanged,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) => {
  const showAmount = useUserStore((s) => s.showAmount);
  const renderAmount = (val: number) =>
    showAmount ? formatVND(val) : "••••••••";

  const observerTargetRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver: Tự động tải trang tiếp theo khi cuộn xuống đáy
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !onLoadMore || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: "150px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore, loading]);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(
    null,
  );
  const [activeCustomersModal, setActiveCustomersModal] =
    useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{
    id: string;
    code: string;
    title?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // States quản lý checkbox chọn đơn hàng
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [isShowSelectedModalOpen, setIsShowSelectedModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  // Cập nhật trạng thái indeterminate cho checkbox "chọn tất cả" ở header
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        selectedIds.length > 0 && selectedIds.length < orders.length;
    }
  }, [selectedIds, orders]);

  // Chọn/Bỏ chọn một đơn hàng
  const handleToggleSelect = (orderId: string) => {
    setSelectedIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  // Chọn tất cả hoặc bỏ chọn tất cả
  const handleToggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o._id));
    }
  };

  // Bỏ chọn tất cả
  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Xác nhận xóa hàng loạt
  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    const idsToDelete = [...selectedIds];
    setIsBatchDeleting(true);
    try {
      await Promise.all(idsToDelete.map((id) => orderApi.delete(id)));
      setSelectedIds([]);
      setIsBatchDeleteModalOpen(false);
      onDeleted(idsToDelete);
    } catch (e) {
      alert("Đã xảy ra lỗi khi xóa đơn hàng");
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    const idToDelete = orderToDelete.id;
    setIsDeleting(true);
    try {
      await orderApi.delete(idToDelete);
      setOrderToDelete(null);
      onDeleted(idToDelete);
    } catch (e) {
      alert("Không thể xóa đơn hàng");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "---";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
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
          Tạo đơn hàng mới để theo dõi sản phẩm, danh sách khách hàng, link
          Facebook, tổng tiền, tiền đã thanh toán và công nợ.
        </p>
      </div>
    );
  }

  const selectedOrders = orders.filter((o) => selectedIds.includes(o._id));
  const selectedTotalAmount = selectedOrders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0,
  );
  const selectedPaidAmount = selectedOrders.reduce(
    (sum, o) => sum + (Number(o.paidAmount) || 0),
    0,
  );
  const selectedRemainingAmount = Math.max(
    0,
    selectedTotalAmount - selectedPaidAmount,
  );

  return (
    <>
      {/* THANH THAO TÁC HÀNG LOẠT (BULK ACTION BAR) */}
      {selectedIds.length > 0 && (
        <div className="mb-3 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              Đã chọn <span className="underline">{selectedIds.length}</span> /{" "}
              {orders.length} đơn hàng
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              title="Hủy tích chọn các dòng"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setIsShowSelectedModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold shadow-sm transition-all cursor-pointer"
              title="Xem danh sách các đơn hàng đã được chọn"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Show</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExportPdfModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              title="Xuất các đơn hàng đã chọn dưới dạng PDF"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Xuất PDF</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã chọn ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="max-h-[620px] overflow-y-auto overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm">
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                {/* CỘT CHECKBOX CHỌN TẤT CẢ */}
                <th className="py-3.5 px-3 text-center w-12">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={
                      orders.length > 0 && selectedIds.length === orders.length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 bg-white dark:bg-slate-900 cursor-pointer accent-emerald-500"
                    title={
                      selectedIds.length === orders.length
                        ? "Bỏ chọn tất cả"
                        : "Chọn tất cả đơn hàng"
                    }
                  />
                </th>
                <th className="py-3.5 px-4 text-center w-28">Mã Đơn Hàng</th>
                <th className="py-3.5 px-4 w-16 text-center">Hình Ảnh</th>
                <th className="py-3.5 px-4">Tên Đơn Hàng</th>
                <th className="py-3.5 px-4">Danh Sách Khách Hàng</th>
                <th className="py-3.5 px-4">Ngày Lên Đơn</th>
                <th className="py-3.5 px-4 text-right">
                  Tổng Tiền & Thanh Toán
                </th>
                <th className="py-3.5 px-4 text-center">Trạng Thái Đơn</th>
                <th className="py-3.5 px-4 text-center w-24">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {orders.map((order) => {
                const custList =
                  order.customers && order.customers.length > 0
                    ? order.customers
                    : [
                        {
                          name: order.customerName || "Khách lẻ",
                          phone: order.customerPhone,
                          facebookUrl: "",
                          amount: order.totalAmount,
                          paidAmount: order.paidAmount,
                          orderDate: order.orderDate,
                          status: order.status,
                          paymentStatus: order.paymentStatus,
                        },
                      ];
                const mainCustomer = custList[0];
                const extraCount = custList.length - 1;

                const isCompleted = order.status === "COMPLETED";
                const orderTotal = Number(order.totalAmount) || 0;
                const orderPaid = isCompleted ? orderTotal : (Number(order.paidAmount) || 0);
                const orderRemaining = isCompleted ? 0 : Math.max(0, orderTotal - orderPaid);
                const isSelected = selectedIds.includes(order._id);

                return (
                  <tr
                    key={order._id}
                    className={`transition-colors ${
                      isSelected
                        ? "bg-emerald-500/10 hover:bg-emerald-500/15 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                    }`}
                  >
                    {/* CỘT CHECKBOX TỪNG ĐƠN HÀNG */}
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(order._id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 bg-white dark:bg-slate-900 cursor-pointer accent-emerald-500"
                        title={isSelected ? "Bỏ chọn đơn này" : "Chọn đơn này"}
                      />
                    </td>

                    {/* MÃ ĐƠN HÀNG (Thay thế STT) */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetail(order)}
                        className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-500/20 shadow-sm inline-block transition-colors cursor-pointer"
                        title="Xem chi tiết đơn hàng"
                      >
                        {order.orderCode}
                      </button>
                    </td>

                    {/* Image */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <OrderThumbnail
                          src={order.imageUrl}
                          alt={order.title}
                          onClick={() => setPreviewImage(order.imageUrl || null)}
                          className="w-10 h-10"
                        />
                      </div>
                    </td>

                    {/* Title */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetail(order)}
                        className="font-bold text-slate-900 dark:text-white text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer"
                        title="Xem chi tiết đơn hàng"
                      >
                        {order.title}
                      </button>
                      {order.note && (
                        <div
                          className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5"
                          title={order.note}
                        >
                          • {order.note}
                        </div>
                      )}
                    </td>

                    {/* Customers List */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {mainCustomer?.name
                            ? mainCustomer.name.charAt(0).toUpperCase()
                            : "K"}
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {mainCustomer?.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-indigo-500/20">
                          SL: {mainCustomer?.quantity || 1}
                        </span>
                        {(mainCustomer?.size || order.size) && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px] border border-purple-500/20">
                            Size: {mainCustomer?.size || order.size}
                          </span>
                        )}
                        {(mainCustomer?.color || order.color) && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/20">
                            Màu: {mainCustomer?.color || order.color}
                          </span>
                        )}

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
                        {(mainCustomer?.facebookUrl || order.customerFacebookUrl || order.facebookUrl) && (
                          <a
                            href={mainCustomer?.facebookUrl || order.customerFacebookUrl || order.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline flex items-center gap-0.5 font-medium"
                            title={mainCustomer?.facebookUrl || order.customerFacebookUrl || order.facebookUrl}
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
                        <span>
                          {formatDate(
                            order.orderDate || mainCustomer?.orderDate,
                          )}
                        </span>
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
                        onStatusChanged={(newStatus) =>
                          onStatusChanged(order._id, newStatus)
                        }
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetail(order)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          title="Xem chi tiết đơn hàng"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(order)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                          title="Chỉnh sửa đơn hàng"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setOrderToDelete({
                              id: order._id,
                              code: order.orderCode,
                              title: order.title,
                            })
                          }
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
          const custList =
            order.customers && order.customers.length > 0
              ? order.customers
              : [
                  {
                    name: order.customerName || "Khách lẻ",
                    phone: order.customerPhone,
                    facebookUrl: "",
                    amount: order.totalAmount,
                    paidAmount: order.paidAmount,
                    orderDate: order.orderDate,
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                  },
                ];
          const mainCustomer = custList[0];
          const extraCount = custList.length - 1;

          const totalQty = custList.reduce(
            (sum, c) => sum + (Number(c.quantity) || 1),
            0,
          );
          const isCompleted = order.status === "COMPLETED";
          const orderTotal = Number(order.totalAmount) || 0;
          const orderPaid = isCompleted ? orderTotal : (Number(order.paidAmount) || 0);
          const orderRemaining = isCompleted ? 0 : Math.max(0, orderTotal - orderPaid);

          const isSelected = selectedIds.includes(order._id);

          return (
            <div
              key={order._id}
              className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-3 transition-all ${
                isSelected
                  ? "border-emerald-500/60 bg-emerald-500/5 dark:bg-emerald-500/5 ring-1 ring-emerald-500/30"
                  : "border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Row 1: Top Bar (Checkbox + (Mã đơn & Ngày) + Status Dropdown + Nút Xóa Đỏ) */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(order._id)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500/30 bg-white dark:bg-slate-900 cursor-pointer accent-emerald-500 shrink-0 mt-0.5"
                    title={isSelected ? "Bỏ chọn" : "Chọn"}
                  />
                  <div className="flex flex-col items-start min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetail(order)}
                      className="font-mono text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 shadow-xs shrink-0 transition-colors cursor-pointer"
                      title="Xem chi tiết đơn hàng"
                    >
                      {order.orderCode}
                    </button>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                      {formatDate(order.orderDate || mainCustomer?.orderDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <OrderStatusDropdown
                    orderId={order._id}
                    currentStatus={order.status}
                    onStatusChanged={(newStatus) =>
                      onStatusChanged(order._id, newStatus)
                    }
                  />

                  {/* Nút Xóa Đơn Hàng Màu Đỏ Lên Trên Top Bar */}
                  <button
                    type="button"
                    onClick={() =>
                      setOrderToDelete({
                        id: order._id,
                        code: order.orderCode,
                        title: order.title,
                      })
                    }
                    className="p-1.5 rounded-xl text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer shadow-xs"
                    title="Xóa đơn hàng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Product information & Price on Right */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <OrderThumbnail
                    src={order.imageUrl}
                    alt={order.title}
                    onClick={() => setPreviewImage(order.imageUrl || null)}
                    className="w-12 h-12"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetail(order)}
                      className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer block"
                      title="Xem chi tiết đơn hàng"
                    >
                      {order.title}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400">
                        SL: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{totalQty}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Khối tiền đơn hàng nằm bên phải (Chỉ hiển thị giá tiền, không icon mắt, không thu/nợ) */}
                <div className="text-right shrink-0 pt-0.5">
                  <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-none">
                    {renderAmount(orderTotal)}
                  </span>
                </div>
              </div>

              {/* Row 3: Customer Bar */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {mainCustomer?.name ? mainCustomer.name.charAt(0).toUpperCase() : "K"}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {mainCustomer?.name || "Khách lẻ"}
                  </span>
                  {extraCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveCustomersModal(order)}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0"
                    >
                      +{extraCount} khách
                    </button>
                  )}
                </div>

                {/* SĐT khách hàng nằm sát lề bên phải */}
                {(mainCustomer?.phone || order.customerPhone) && (
                  <a
                    href={`tel:${mainCustomer?.phone || order.customerPhone}`}
                    className="flex items-center gap-1 font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0 transition-colors"
                    title={`Gọi cho ${mainCustomer?.name || "khách"}`}
                  >
                    <Phone className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>{mainCustomer?.phone || order.customerPhone}</span>
                  </a>
                )}
              </div>

              {/* Row 4: Action buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(order)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Xem chi tiết đơn hàng"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Chi tiết</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(order)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* INFINITE SCROLL SENTINEL & LOADING INDICATOR */}
      <div
        ref={observerTargetRef}
        className="py-4 flex flex-col items-center justify-center gap-2"
      >
        {loadingMore && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <span>Đang tải thêm 20 đơn hàng tiếp theo...</span>
          </div>
        )}

        {!hasMore && orders.length > 0 && !loading && (
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 text-center py-2">
            ✓ Đã hiển thị tất cả {orders.length} đơn hàng
          </p>
        )}
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
                    Chi Tiết Khách Hàng(
                    {activeCustomersModal.customers?.length || 1})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Đơn hàng:{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {activeCustomersModal.title}
                    </span>{" "}
                    ({activeCustomersModal.orderCode})
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
              {(activeCustomersModal.customers &&
              activeCustomersModal.customers.length > 0
                ? activeCustomersModal.customers
                : [
                    {
                      name: activeCustomersModal.customerName || "Khách lẻ",
                      phone: activeCustomersModal.customerPhone,
                      facebookUrl: "",
                      amount: activeCustomersModal.totalAmount,
                      paidAmount: activeCustomersModal.paidAmount,
                      orderDate: activeCustomersModal.orderDate,
                      status: activeCustomersModal.status,
                      paymentStatus: activeCustomersModal.paymentStatus,
                      note: activeCustomersModal.note,
                    },
                  ]
              ).map((cust, i) => {
                const conf =
                  ORDER_STATUS_CONFIG[cust.status || "ORDERED"] ||
                  ORDER_STATUS_CONFIG.ORDERED;
                const isCustCompleted =
                  cust.status === "COMPLETED" ||
                  activeCustomersModal.status === "COMPLETED";
                const cAmount = Number(cust.amount) || 0;
                const cPaid = isCustCompleted
                  ? cAmount
                  : Number(cust.paidAmount) || 0;
                const cRemaining = isCustCompleted
                  ? 0
                  : Math.max(0, cAmount - cPaid);

                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {cust.imageUrl ? (
                          <a
                            href={cust.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group shrink-0 cursor-pointer"
                            title="Bấm để xem ảnh kích thước gốc"
                          >
                            <img
                              src={cust.imageUrl}
                              alt={cust.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm transition-transform group-hover:scale-105"
                            />
                          </a>
                        ) : (
                          <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {i + 1}
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                              {cust.name}
                            </p>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20">
                              SL: {cust.quantity || 1}
                            </span>
                            {(cust.size || activeCustomersModal.size) && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs border border-purple-500/20">
                                Size: {cust.size || activeCustomersModal.size}
                              </span>
                            )}
                            {(cust.color || activeCustomersModal.color) && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20">
                                Màu: {cust.color || activeCustomersModal.color}
                              </span>
                            )}
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
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            {cust.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{cust.phone}</span>
                              </span>
                            )}
                            {cust.address && (
                              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{cust.address}</span>
                              </span>
                            )}
                          </div>
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
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Tổng tiền
                        </span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {renderAmount(cAmount)}
                        </span>
                      </div>
                      <div className="border-x border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Đã trả
                        </span>
                        <span className="font-extrabold text-emerald-500">
                          {renderAmount(cPaid)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">
                          Còn nợ
                        </span>
                        <span
                          className={`font-extrabold ${cRemaining > 0 ? "text-amber-500" : "text-slate-400"}`}
                        >
                          {renderAmount(cRemaining)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Ngày tạo:{" "}
                        <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                          {formatDate(cust.orderDate)}
                        </strong>
                      </span>
                      {cust.note && (
                        <span className="italic truncate max-w-xs">
                          Ghi chú: {cust.note}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            {(() => {
              const isModalCompleted = activeCustomersModal.status === "COMPLETED";
              const modalTotal = Number(activeCustomersModal.totalAmount) || 0;
              const modalPaid = isModalCompleted ? modalTotal : (Number(activeCustomersModal.paidAmount) || 0);
              const modalRemaining = isModalCompleted ? 0 : Math.max(0, modalTotal - modalPaid);

              return (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500">
                      Tổng đơn ({activeCustomersModal.customers?.length || 1} khách):
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-white ml-2">
                      {renderAmount(modalTotal)}
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    <span className="text-emerald-500 font-bold">
                      Đã thu: {renderAmount(modalPaid)}
                    </span>
                    {modalRemaining > 0 && (
                      <span className="text-amber-500 font-bold ml-2">
                        | Còn nợ: {renderAmount(modalRemaining)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
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
              src={getFullImageUrl(previewImage || "")}
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
          <div className="space-y-3 text-left">
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Bạn có chắc chắn muốn xóa đơn hàng{" "}
              <strong className="text-rose-500 font-bold font-mono">
                {orderToDelete?.code}
              </strong>
              {orderToDelete?.title ? ` - ${orderToDelete.title}` : ""}?
            </p>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Dữ liệu đơn hàng này sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </span>
            </div>
          </div>
        }
        confirmText="Xác nhận xóa đơn hàng"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* BATCH DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => {
          if (!isBatchDeleting) setIsBatchDeleteModalOpen(false);
        }}
        onConfirm={handleConfirmBatchDelete}
        title={`Xác nhận xóa ${selectedIds.length} đơn hàng đã chọn`}
        message={
          <div className="space-y-3 text-left">
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              Bạn có chắc chắn muốn{" "}
              <span className="text-rose-500 font-bold">xóa vĩnh viễn</span>{" "}
              <span className="font-extrabold text-slate-900 dark:text-white">
                {selectedIds.length} đơn hàng
              </span>{" "}
              này khỏi hệ thống?
            </p>

            {/* Danh sách mã đơn hàng sẽ bị xóa */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">
                  Các đơn hàng:
                </span>
                <span className="font-bold text-rose-500">
                  Tổng tiền: {renderAmount(selectedTotalAmount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {selectedOrders.map((o) => (
                  <span
                    key={o._id}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    title={o.title}
                  >
                    <span>{o.orderCode}</span>
                    {o.title && (
                      <span className="text-slate-400 font-sans truncate max-w-[90px]">
                        ({o.title})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cảnh báo: Dữ liệu bị xóa sẽ không thể hoàn tác!</span>
            </div>
          </div>
        }
        confirmText={`Xóa vĩnh viễn ${selectedIds.length} đơn`}
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isBatchDeleting}
      />

      {/* MODAL HIỂN THỊ CÁC DÒNG ĐÃ CHECKBOX (SHOW SELECTED MODAL) */}
      {isShowSelectedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsShowSelectedModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-sm">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      Danh Sách Đơn Hàng
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                      {selectedOrders.length} đơn
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Các dòng đơn hàng đang được tích checkbox trong bảng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShowSelectedModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Summary Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Tổng tiền
                </span>
                <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {renderAmount(selectedTotalAmount)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Đã thu
                </span>
                <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {renderAmount(selectedPaidAmount)}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/20">
                <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  Còn nợ
                </span>
                <span className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400">
                  {renderAmount(selectedRemainingAmount)}
                </span>
              </div>
            </div>

            {/* Danh sách các đơn hàng đã chọn */}
            <div className="overflow-y-auto flex-1 pr-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
              {selectedOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  Không còn đơn hàng nào được chọn
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4 text-center w-28">Mã đơn</th>
                      <th className="py-3 px-3 w-16 text-center">Ảnh</th>
                      <th className="py-3 px-4">Tên đơn hàng</th>
                      <th className="py-3 px-4">Khách hàng</th>
                      <th className="py-3 px-4">Ngày lên đơn</th>
                      <th className="py-3 px-4 text-right">
                        Tổng tiền & Đã thu
                      </th>
                      <th className="py-3 px-4 text-center w-36">Trạng thái</th>
                      <th className="py-3 px-3 text-center w-14">Bỏ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedOrders.map((order) => {
                      const statusConfig = ORDER_STATUS_CONFIG[
                        order.status
                      ] || {
                        label: order.status,
                        color: "bg-slate-500/10 text-slate-500",
                      };
                      const custName =
                        order.customers?.[0]?.name ||
                        order.customerName ||
                        "Khách lẻ";

                      return (
                        <tr
                          key={order._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 shadow-sm inline-block">
                              {order.orderCode}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center">
                              <OrderThumbnail
                                src={order.imageUrl}
                                alt={order.title}
                                onClick={() => setPreviewImage(order.imageUrl || null)}
                                className="w-10 h-10"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white text-sm">
                            <div className="line-clamp-1" title={order.title}>
                              {order.title}
                            </div>
                            {order.note && (
                              <div
                                className="text-[11px] text-slate-400 truncate mt-0.5"
                                title={order.note}
                              >
                                • {order.note}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate" title={custName}>
                                {custName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] shrink-0 border border-indigo-500/20">
                                SL: {order.customers?.[0]?.quantity || 1}
                              </span>
                              {(order.customers?.[0]?.size || order.size) && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-[10px] shrink-0 border border-purple-500/20">
                                  Size: {order.customers?.[0]?.size || order.size}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {formatDate(
                                  order.orderDate ||
                                    order.customers?.[0]?.orderDate,
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                            <div className="text-sm">
                              {renderAmount(Number(order.totalAmount) || 0)}
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                              Đã thu:{" "}
                              {renderAmount(Number(order.paidAmount) || 0)}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(order._id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Bỏ chọn đơn này"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleDeselectAll();
                  setIsShowSelectedModalOpen(false);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Bỏ chọn tất cả
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportPdfModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Xuất danh sách đơn hàng đã chọn dưới dạng PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Xuất PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsShowSelectedModalOpen(false);
                    setIsBatchDeleteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold shadow-sm shadow-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa các đơn này ({selectedOrders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShowSelectedModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XUẤT PDF */}
      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        orders={selectedOrders}
      />

      {/* MODAL XEM CHI TIẾT ĐƠN HÀNG */}
      <OrderDetailModal
        order={selectedOrderDetail}
        isOpen={!!selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
        onEdit={onEdit}
        onStatusChanged={onStatusChanged}
        onPreviewImage={(url) => setPreviewImage(url)}
      />
    </>
  );
};

