"use client";

import React, { useState } from "react";
import {
  X,
  Edit2,
  Calendar,
  Phone,
  MapPin,
  ExternalLink,
  Package,
  Copy,
  Check,
  Tag,
  Truck,
  CreditCard,
  Users,
  Layers,
  FileText,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import {
  Order,
  OrderStatusType,
  ORDER_STATUS_CONFIG,
} from "@/entities/order";
import { OrderStatusDropdown } from "./OrderStatusDropdown";
import { formatVND } from "@/shared/lib/formatters";
import { useUserStore } from "@/entities/user/useUserStore";
import { getFullImageUrl } from "@/shared/lib/uploadApi";

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (order: Order) => void;
  onStatusChanged?: (orderId: string, newStatus: OrderStatusType) => void;
  onPreviewImage?: (url: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
  onStatusChanged,
  onPreviewImage,
}) => {
  const showAmount = useUserStore((s) => s.showAmount);
  const [localPreviewImage, setLocalPreviewImage] = useState<string | null>(
    null,
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const renderAmount = (val?: number) => {
    if (val === undefined || val === null) return "0 đ";
    return showAmount ? formatVND(val) : "••••••••";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Chưa cập nhật";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleCopy = (text: string, type: "code" | "address" | "phone", id?: string) => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === "address") {
      setCopiedAddress(id || "main");
      setTimeout(() => setCopiedAddress(null), 2000);
    } else if (type === "phone") {
      setCopiedPhone(id || "main");
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const custList =
    order.customers && order.customers.length > 0
      ? order.customers
      : [
          {
            name: order.customerName || "Khách lẻ",
            phone: order.customerPhone,
            facebookUrl: order.facebookUrl || order.customerFacebookUrl || "",
            address: order.address || order.customerAddress || "",
            size: order.size,
            color: order.color,
            imageUrl: order.imageUrl,
            quantity: 1,
            amount: order.totalAmount,
            paidAmount: order.paidAmount,
            shippingFee: order.shippingFee,
            costPrice: order.costPrice,
            orderDate: order.orderDate,
            status: order.status,
            paymentStatus: order.paymentStatus,
            note: order.note,
          },
        ];

  const isCompleted = order.status === "COMPLETED";
  const totalQuantity = custList.reduce((sum, c) => sum + (c.quantity || 1), 0);
  const totalAmount = Number(order.totalAmount) || 0;
  const paidAmount = isCompleted ? totalAmount : (Number(order.paidAmount) || 0);
  const remainingAmount = isCompleted ? 0 : Math.max(0, totalAmount - paidAmount);
  const costPrice = Number(order.costPrice) || 0;
  const shippingFee = Number(order.shippingFee) || 0;
  
  // Tính lợi nhuận ước tính = Tổng tiền cần thu - Tiền ship - Tiền vốn (nếu có)
  const estimatedProfit = totalAmount - shippingFee - costPrice;

  const currentStatusConfig =
    ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.ORDERED;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Chi Tiết Đơn Hàng
                </h2>
                <button
                  type="button"
                  onClick={() => handleCopy(order.orderCode, "code")}
                  className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Bấm để sao chép mã đơn"
                >
                  <span>{order.orderCode}</span>
                  {copiedCode ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3 opacity-60" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(order.orderDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onStatusChanged ? (
              <OrderStatusDropdown
                orderId={order._id}
                currentStatus={order.status}
                onStatusChanged={(newStatus) =>
                  onStatusChanged(order._id, newStatus)
                }
              />
            ) : (
              <span
                className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${currentStatusConfig.bg} ${currentStatusConfig.text} border ${currentStatusConfig.border}`}
              >
                {currentStatusConfig.label}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* KHỐI 1: THÔNG TIN SẢN PHẨM */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-emerald-500" />
              <span>Thông Tin Sản Phẩm</span>
            </h4>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Ảnh sản phẩm */}
              <div className="relative group shrink-0">
                {order.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalPreviewImage(order.imageUrl!);
                      onPreviewImage?.(order.imageUrl!);
                    }}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/20 bg-slate-100 dark:bg-slate-800 shadow-md relative group/img cursor-pointer block hover:scale-105 active:scale-95 transition-all"
                    title="Bấm để xem ảnh phóng to"
                  >
                    <img
                      src={getFullImageUrl(order.imageUrl)}
                      alt={order.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <span>Phóng to</span>
                    </div>
                  </button>
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 gap-1.5 shadow-sm">
                    <Package className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-medium">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Chi tiết sản phẩm */}
              <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Tên sản phẩm
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {order.title}
                  </h3>
                </div>

                {order.note && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-left">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-700 dark:text-slate-300">Ghi chú:</strong>{" "}
                      {order.note}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KHỐI 2: DANH SÁCH KHÁCH HÀNG & ĐỊA CHỈ GIAO HÀNG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-500" />
                <span>Thông Tin Khách Hàng ({custList.length})</span>
              </h4>
            </div>

            <div className="space-y-2.5">
              {custList.map((cust, idx) => {
                const address = cust.address || order.address || order.customerAddress;
                const phone = cust.phone || order.customerPhone;
                const fbUrl = cust.facebookUrl || order.facebookUrl || order.customerFacebookUrl;
                const isSingle = custList.length === 1;

                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                  >
                    {/* Hàng 1: Khách hàng & Phân loại riêng */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                          {cust.name ? cust.name.charAt(0).toUpperCase() : `${idx + 1}`}
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {cust.name || "Khách lẻ"}
                        </span>
                        {!isSingle && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            (Khách #{idx + 1})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap text-xs">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                          SL: {cust.quantity || 1}
                        </span>
                        {cust.size && (
                          <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                            Size: {cust.size}
                          </span>
                        )}
                        {cust.color && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                            Màu: {cust.color}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hàng 2: SĐT & Link FB */}
                    {(phone || fbUrl) && (
                      <div className="flex items-center gap-3 text-xs flex-wrap">
                        {phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <a
                              href={`tel:${phone}`}
                              className="font-semibold hover:underline"
                            >
                              {phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(phone, "phone", `phone-${idx}`)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Sao chép SĐT"
                            >
                              {copiedPhone === `phone-${idx}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {fbUrl && (
                          <a
                            href={fbUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-500 hover:text-blue-400 hover:underline bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link Facebook</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Hàng 3: Địa chỉ giao hàng */}
                    {address ? (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-400 block text-[10px] uppercase">
                              Địa chỉ nhận hàng:
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                              {address}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(address, "address", `addr-${idx}`)}
                          className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                          title="Sao chép địa chỉ"
                        >
                          {copiedAddress === `addr-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Chưa có thông tin địa chỉ nhận hàng
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHỐI 3: THÔNG TIN TÀI CHÍNH & THANH TOÁN */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              <span>Tài Chính & Thanh Toán</span>
            </h4>

            {/* Chi tiết các khoản: Vốn - Bán - Ship */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-slate-400" />
                  <span>Tiền vốn / Giá gốc</span>
                </span>
                <div className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                  {renderAmount(costPrice)}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-cyan-500" />
                  <span>Tiền ship</span>
                </span>
                <div className="font-extrabold text-sm text-cyan-600 dark:text-cyan-400">
                  {renderAmount(shippingFee)}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  <span>Lợi nhuận tạm tính</span>
                </span>
                <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {renderAmount(estimatedProfit)}
                </div>
              </div>
            </div>

            {/* Khối nổi bật: Tổng cần thu, Đã thu, Nợ */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-indigo-500/10 dark:from-emerald-950/30 dark:via-slate-900 dark:to-indigo-950/30 border border-emerald-500/20 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                  Tổng Tiền Cần Thu:
                </span>
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {renderAmount(totalAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    Đã thanh toán
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {renderAmount(paidAmount)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    Còn lại cần thu (Nợ)
                  </span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    {renderAmount(remainingAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(order);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa Đơn Hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* POPUP LIGHTBOX PHÓNG TO ẢNH */}
      {localPreviewImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLocalPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLocalPreviewImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Đóng ảnh"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={getFullImageUrl(localPreviewImage)}
              alt="Ảnh phóng to"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
