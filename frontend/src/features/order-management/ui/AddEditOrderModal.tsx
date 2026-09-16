"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  Image as ImageIcon,
  Users,
  UserPlus,
  ExternalLink,
  Edit2,
  CheckCircle,
  Clock,
  UploadCloud,
  Loader2,
  Maximize2,
  Eye,
} from "lucide-react";
import {
  Order,
  OrderCustomer,
  CreateOrderPayload,
  OrderStatusType,
  PaymentStatusType,
  ORDER_STATUS_CONFIG,
  orderApi,
} from "@/entities/order";
import { Customer, customerApi } from "@/entities/customer";
import {
  formatVND,
  formatNumberWithSpaces,
  parseFormattedNumber,
} from "@/shared/lib/formatters";
import { compressImageFile } from "@/shared/lib/imageUtils";
import { uploadOrderImage, getFullImageUrl } from "@/shared/lib/uploadApi";

interface AddEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderToEdit?: Order | null;
}

const createEmptyCustomer = (): OrderCustomer => ({
  name: "",
  phone: "",
  facebookUrl: "",
  quantity: 1,
  amount: 0,
  paidAmount: 0,
  orderDate: new Date().toISOString().split("T")[0],
  status: "ORDERED",
  paymentStatus: "UNPAID",
  note: "",
});

export const AddEditOrderModal: React.FC<AddEditOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderToEdit,
}) => {
  const isEditing = Boolean(orderToEdit);

  const [title, setTitle] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">(
    "upload",
  );
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [previewFullImage, setPreviewFullImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [costPriceStr, setCostPriceStr] = useState("");
  const [shippingFeeStr, setShippingFeeStr] = useState("");
  const [customers, setCustomers] = useState<OrderCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);

  // Sub-modal state for Customer
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerIndex, setEditingCustomerIndex] = useState<
    number | null
  >(null);
  const [custForm, setCustForm] = useState<OrderCustomer>(
    createEmptyCustomer(),
  );
  const [custQuantityStr, setCustQuantityStr] = useState("1");
  const [custAmountStr, setCustAmountStr] = useState("");
  const [custPaidAmountStr, setCustPaidAmountStr] = useState("");
  const [custError, setCustError] = useState("");

  useEffect(() => {
    if (isOpen) {
      customerApi
        .getAll()
        .then((res) => setAvailableCustomers(res))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingImage(true);
    try {
      // Nén ảnh độ phân giải tối ưu 1200px, đảm bảo sắc nét
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.8);
      // Upload trực tiếp lên backend và lưu file tĩnh WebP
      const savedUrl = await uploadOrderImage(compressedDataUrl);
      setImageUrl(savedUrl);
    } catch (err: any) {
      alert(err.message || "Không thể xử lý hình ảnh");
    } finally {
      setIsCompressingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (orderToEdit) {
      setTitle(orderToEdit.title || "");
      setOrderCode(orderToEdit.orderCode || "");
      setImageUrl(orderToEdit.imageUrl || "");
      setCostPriceStr(
        orderToEdit.costPrice
          ? formatNumberWithSpaces(orderToEdit.costPrice)
          : "",
      );
      setShippingFeeStr(
        orderToEdit.shippingFee
          ? formatNumberWithSpaces(orderToEdit.shippingFee)
          : "",
      );

      if (orderToEdit.customers && orderToEdit.customers.length > 0) {
        setCustomers(
          orderToEdit.customers.map((c) => ({
            name: c.name || "",
            phone: c.phone || "",
            facebookUrl: c.facebookUrl || "",
            quantity:
              c.quantity && Number(c.quantity) > 0 ? Number(c.quantity) : 1,
            amount: c.amount || 0,
            paidAmount: c.paidAmount || 0,
            orderDate: c.orderDate
              ? new Date(c.orderDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            status: c.status || "ORDERED",
            paymentStatus: c.paymentStatus || "UNPAID",
            note: c.note || "",
          })),
        );
      } else if (orderToEdit.customerName) {
        setCustomers([
          {
            name: orderToEdit.customerName,
            phone: orderToEdit.customerPhone || "",
            facebookUrl: "",
            quantity: 1,
            amount: orderToEdit.totalAmount || 0,
            paidAmount: orderToEdit.paidAmount || 0,
            orderDate: orderToEdit.orderDate
              ? new Date(orderToEdit.orderDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            status: orderToEdit.status || "ORDERED",
            paymentStatus: orderToEdit.paymentStatus || "UNPAID",
            note: orderToEdit.note || "",
          },
        ]);
      } else {
        setCustomers([]);
      }
    } else {
      setTitle("");
      setOrderCode("");
      setImageUrl("");
      setCostPriceStr("");
      setShippingFeeStr("");
      setCustomers([]);
    }
    setError("");
  }, [orderToEdit, isOpen]);

  if (!isOpen) return null;

  const costPrice = parseFormattedNumber(costPriceStr);
  const shippingFee = parseFormattedNumber(shippingFeeStr);

  // Tính tổng tiền & tiền đã thanh toán từ tất cả khách hàng
  const calculatedTotalAmount = customers.reduce(
    (sum, c) => sum + (Number(c.amount) || 0),
    0,
  );
  const calculatedPaidAmount = customers.reduce(
    (sum, c) => sum + (Number(c.paidAmount) || 0),
    0,
  );
  const calculatedRemaining = Math.max(
    0,
    calculatedTotalAmount - calculatedPaidAmount,
  );
  const estimatedProfit = calculatedTotalAmount - shippingFee - costPrice;

  // Mở Modal Thêm mới khách hàng
  const handleOpenAddCustomerModal = () => {
    setEditingCustomerIndex(null);
    setCustForm(createEmptyCustomer());
    setCustQuantityStr("1");
    setCustAmountStr("");
    setCustPaidAmountStr("");
    setCustError("");
    setIsCustomerModalOpen(true);
  };

  // Mở Modal Chỉnh sửa khách hàng
  const handleOpenEditCustomerModal = (index: number) => {
    setEditingCustomerIndex(index);
    const target = customers[index];
    setCustForm({ ...target });
    setCustQuantityStr(String(target.quantity || 1));
    setCustAmountStr(
      target.amount ? formatNumberWithSpaces(target.amount) : "",
    );
    setCustPaidAmountStr(
      target.paidAmount ? formatNumberWithSpaces(target.paidAmount) : "",
    );
    setCustError("");
    setIsCustomerModalOpen(true);
  };

  // Lưu khách hàng từ Sub-modal
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) {
      setCustError("Vui lòng nhập họ và tên khách hàng");
      return;
    }

    const total = parseFormattedNumber(custAmountStr);
    const paid = parseFormattedNumber(custPaidAmountStr);
    const qty = Math.max(1, parseInt(custQuantityStr) || 1);
    let paymentStatus: PaymentStatusType = custForm.paymentStatus || "UNPAID";

    if (paid >= total && total > 0) {
      paymentStatus = "PAID";
    } else if (paid > 0) {
      paymentStatus = "PARTIAL";
    } else {
      paymentStatus = "UNPAID";
    }

    const newCustomerData: OrderCustomer = {
      ...custForm,
      name: custForm.name.trim(),
      phone: custForm.phone?.trim() || "",
      facebookUrl: custForm.facebookUrl?.trim() || "",
      quantity: qty,
      amount: total,
      paidAmount: paid,
      paymentStatus,
      status: custForm.status || "ORDERED",
      orderDate: custForm.orderDate || new Date().toISOString().split("T")[0],
      note: custForm.note?.trim() || "",
    };

    if (editingCustomerIndex !== null) {
      setCustomers((prev) => {
        const next = [...prev];
        next[editingCustomerIndex] = newCustomerData;
        return next;
      });
    } else {
      setCustomers((prev) => [...prev, newCustomerData]);
    }

    setIsCustomerModalOpen(false);
  };

  // Xóa khách hàng
  const handleRemoveCustomer = (index: number) => {
    setCustomers((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Order Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập Tên đơn hàng");
      return;
    }

    if (customers.length === 0) {
      setError("Vui lòng thêm ít nhất 1 khách hàng vào đơn hàng");
      return;
    }

    setLoading(true);
    setError("");

    const payload: CreateOrderPayload = {
      title: title.trim(),
      orderCode: orderCode.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      shippingFee: Number(shippingFee) || 0,
      customers: customers.map((c) => ({
        ...c,
        orderDate: c.orderDate
          ? new Date(c.orderDate).toISOString()
          : new Date().toISOString(),
      })),
      totalAmount: calculatedTotalAmount,
      paidAmount: calculatedPaidAmount,
      orderDate: customers[0]?.orderDate,
    };

    try {
      if (isEditing && orderToEdit) {
        await orderApi.update(orderToEdit._id, payload);
      } else {
        await orderApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Có lỗi xảy ra khi lưu đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* MAIN MODAL: THÔNG TIN ĐƠN HÀNG */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {isEditing ? "Chỉnh Sửa Đơn Hàng" : "Tạo Đơn Hàng Mới"}
                </h3>
                <p className="text-xs text-slate-400">
                  Nhập thông tin sản phẩm, giá vốn, tiền ship và khách hàng
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
          >
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold">
                {error}
              </div>
            )}

            {/* Thông tin cơ bản: Tên đơn & Mã đơn */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên đơn hàng / Sản phẩm{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: 10 Bộ bàn ghế gỗ, Đặt tiệc đoàn 8 người..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Mã đơn hàng
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="DH-0001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {/* Nhập Tiền Vốn & Phí Vận Chuyển (Ship) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tiền vốn hàng hóa</span>
                  </label>
                  {costPrice > 0 && (
                    <span className="text-[11px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                      {formatVND(costPrice)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={costPriceStr}
                  onChange={(e) =>
                    setCostPriceStr(
                      e.target.value.replace(/\D/g, "").slice(0, 14),
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Giá nhập/vốn của sản phẩm
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Phí vận chuyển / ship</span>
                  </label>
                  {shippingFee > 0 && (
                    <span className="text-[11px] font-extrabold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-lg">
                      {formatVND(shippingFee)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={shippingFeeStr}
                  onChange={(e) =>
                    setShippingFeeStr(
                      e.target.value.replace(/\D/g, "").slice(0, 14),
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Tiền ship trả cho bên vận chuyển
                </span>
              </div>
            </div>

            {/* Hình ảnh sản phẩm / Chứng từ (Upload hoặc Dán URL) */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  <span>Hình ảnh sản phẩm / Chứng từ</span>
                </label>
                <div className="flex items-center gap-1 text-[11px] bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImageInputMode("upload")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      imageInputMode === "upload"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    }`}
                  >
                    Tải ảnh lên
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode("url")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      imageInputMode === "url"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-700 dark:hover:text-white"
                    }`}
                  >
                    Dán URL
                  </button>
                </div>
              </div>

              {/* Mode 1: Upload File Ảnh */}
              {imageInputMode === "upload" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {!imageUrl ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/50 dark:bg-slate-900/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 space-y-2 group"
                    >
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        {isCompressingImage ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          <UploadCloud className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {isCompressingImage
                            ? "Đang xử lý và tối ưu ảnh độ nét cao..."
                            : "Nhấn để chọn ảnh từ máy tính / điện thoại"}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          Hỗ trợ PNG, JPG, JPEG, WEBP • Tối ưu độ phân giải cao
                          1600px sắc nét
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                      {/* Khung ảnh xem trước kích thước lớn */}
                      <div
                        onClick={() => setPreviewFullImage(imageUrl)}
                        className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-slate-950/40 border border-slate-200 dark:border-slate-700/80 shrink-0 cursor-pointer group shadow-sm"
                        title="Bấm để xem ảnh phóng to"
                      >
                        <img
                          src={getFullImageUrl(imageUrl)}
                          alt="Xem trước ảnh đơn hàng"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[2px]">
                          <Maximize2 className="w-4 h-4" />
                          <span>Xem lớn</span>
                        </div>
                      </div>

                      {/* Thông tin và các nút thao tác */}
                      <div className="flex-1 w-full space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Đã tải ảnh lên thành công
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Hình ảnh đã được nén tối ưu độ nét cao (1600px), rõ
                          ràng chi tiết sản phẩm và hóa đơn chứng từ.
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setPreviewFullImage(imageUrl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            Xem ảnh lớn
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            Đổi ảnh khác
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Mode 2: Nhập Link URL */
                <div className="space-y-3">
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                  {imageUrl && (
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-3">
                      <div
                        onClick={() => setPreviewFullImage(imageUrl)}
                        className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950/40 shrink-0 cursor-pointer group shadow-sm"
                        title="Bấm để xem ảnh phóng to"
                      >
                        <img
                          src={getFullImageUrl(imageUrl)}
                          alt="Xem trước"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold backdrop-blur-[2px]">
                          <Maximize2 className="w-4 h-4" />
                          <span>Xem lớn</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Ảnh từ liên kết ngoài
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewFullImage(imageUrl)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            Xem lớn
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl("")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Xóa ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DANH SÁCH KHÁCH HÀNG (CUSTOMERS / SPLIT SHIP) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Danh Sách Khách Hàng ({customers.length})
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCustomerModal}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Thêm khách</span>
                </button>
              </div>

              {customers.length === 0 ? (
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <Users className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs text-slate-500">
                    Chưa có khách hàng nào trong đơn này
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddCustomerModal}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Thêm Khách Hàng
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customers.map((c, idx) => {
                    const statusConfig =
                      ORDER_STATUS_CONFIG[c.status || "ORDERED"] ||
                      ORDER_STATUS_CONFIG.ORDERED;
                    const cAmount = Number(c.amount) || 0;
                    const cPaid = Number(c.paidAmount) || 0;
                    const cRemaining = Math.max(0, cAmount - cPaid);

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </p>
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] border border-indigo-500/20">
                                SL: {c.quantity || 1}
                              </span>
                              {c.facebookUrl && (
                                <a
                                  href={c.facebookUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                                  title={c.facebookUrl}
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>FB</span>
                                </a>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              {c.phone && <span>{c.phone}</span>}
                              <span>• {statusConfig.label}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {formatVND(cAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Đã thu:{" "}
                              <strong className="text-emerald-500">
                                {formatVND(cPaid)}
                              </strong>
                              {cRemaining > 0 && (
                                <span className="text-amber-500 ml-1">
                                  | Nợ: {formatVND(cRemaining)}
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCustomerModal(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors cursor-pointer"
                              title="Sửa thông tin khách"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomer(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Xóa khách khỏi đơn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* BẢNG TỔNG KẾT TÀI CHÍNH & LỢI NHẬN DỰ KIẾN */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tổng Doanh Thu
                  </span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {formatVND(calculatedTotalAmount)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tiền Vốn
                  </span>
                  <span className="font-extrabold text-sm text-amber-500">
                    {formatVND(costPrice)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Phí Ship
                  </span>
                  <span className="font-extrabold text-sm text-blue-500">
                    {formatVND(shippingFee)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Lợi Nhuận Dự Kiến
                  </span>
                  <span
                    className={`font-extrabold text-sm ${estimatedProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {formatVND(estimatedProfit)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs hover:opacity-95 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading
                  ? "Đang lưu..."
                  : isEditing
                    ? "Lưu Thay Đổi"
                    : "Tạo Đơn Hàng"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUB-MODAL: THÊM / SỬA KHÁCH HÀNG */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingCustomerIndex !== null
                    ? `Chỉnh Sửa Khách Hàng #${editingCustomerIndex + 1}`
                    : "Thêm Khách Hàng"}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="customer-submodal-form"
              onSubmit={handleSaveCustomer}
              className="flex-1 overflow-y-auto p-5 space-y-4 text-xs"
            >
              {custError && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 font-semibold">
                  {custError}
                </div>
              )}

              {/* Gợi ý chọn nhanh từ danh bạ khách hàng */}
              {availableCustomers.length > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <label className="block font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 text-[11px]">
                    💡 Chọn nhanh từ danh bạ khách hàng quen (
                    {availableCustomers.length})
                  </label>
                  <select
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const found = availableCustomers.find(
                        (c) => c._id === selectedId,
                      );
                      if (found) {
                        setCustForm((prev) => ({
                          ...prev,
                          name: found.name,
                          phone: found.phone || prev.phone || "",
                          facebookUrl:
                            found.facebookUrl || prev.facebookUrl || "",
                          note: found.address
                            ? `Địa chỉ: ${found.address}`
                            : prev.note,
                        }));
                      }
                    }}
                    defaultValue=""
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-500/30 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-emerald-500/40 outline-none text-xs"
                  >
                    <option value="">
                      -- Chọn khách hàng đã có trong danh bạ --
                    </option>
                    {availableCustomers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tên khách hàng & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tên khách hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={custForm.name}
                    onChange={(e) =>
                      setCustForm({ ...custForm, name: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={custForm.phone || ""}
                    onChange={(e) =>
                      setCustForm({ ...custForm, phone: e.target.value })
                    }
                    placeholder="0912 345 678"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Link Facebook (tùy chọn) */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Link Facebook khách hàng (tùy chọn)
                </label>
                <div className="relative">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={custForm.facebookUrl || ""}
                    onChange={(e) =>
                      setCustForm({ ...custForm, facebookUrl: e.target.value })
                    }
                    placeholder="https://facebook.com/username-khach-hang"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Phân tách: Số lượng, Tổng tiền & Tiền đã thanh toán */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[135px_1fr_1fr] gap-3 items-start">
                  {/* Số lượng */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 whitespace-nowrap">
                      Số lượng (SL) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const current = Math.max(
                            1,
                            parseInt(custQuantityStr) || 1,
                          );
                          if (current > 1)
                            setCustQuantityStr(String(current - 1));
                        }}
                        className="w-9 h-10 rounded-l-xl bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Giảm 1"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={custQuantityStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setCustQuantityStr(val);
                        }}
                        onBlur={() => {
                          if (
                            !custQuantityStr ||
                            parseInt(custQuantityStr) < 1
                          ) {
                            setCustQuantityStr("1");
                          }
                        }}
                        placeholder="1"
                        required
                        className="w-full h-10 text-center bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/40 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = Math.max(
                            1,
                            parseInt(custQuantityStr) || 1,
                          );
                          setCustQuantityStr(String(current + 1));
                        }}
                        className="w-9 h-10 rounded-r-xl bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Tăng 1"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Tổng tiền cần thu{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      {parseFormattedNumber(custAmountStr) > 0 && (
                        <span className="text-[11px] font-extrabold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md shrink-0">
                          {formatVND(parseFormattedNumber(custAmountStr))}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={custAmountStr}
                      onChange={(e) =>
                        setCustAmountStr(
                          e.target.value.replace(/\D/g, "").slice(0, 14),
                        )
                      }
                      placeholder="0"
                      required
                      className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/40 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider whitespace-nowrap">
                        Tiền khách đã trả
                      </label>
                      {parseFormattedNumber(custPaidAmountStr) > 0 && (
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                          {formatVND(parseFormattedNumber(custPaidAmountStr))}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={custPaidAmountStr}
                      onChange={(e) =>
                        setCustPaidAmountStr(
                          e.target.value.replace(/\D/g, "").slice(0, 14),
                        )
                      }
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/40 outline-none"
                    />
                  </div>
                </div>

                {/* Line thể hiện % đã trả so với đơn hàng */}
                {(() => {
                  const total = parseFormattedNumber(custAmountStr);
                  const paid = parseFormattedNumber(custPaidAmountStr);
                  const percent =
                    total > 0
                      ? Math.min(100, Math.round((paid / total) * 100))
                      : 0;
                  const remaining = Math.max(0, total - paid);

                  return (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          Tiến độ thanh toán:
                          <strong
                            className={`font-bold ${
                              percent === 100
                                ? "text-emerald-500"
                                : percent > 0
                                  ? "text-indigo-500"
                                  : "text-slate-400"
                            }`}
                          >
                            {percent}%
                          </strong>
                        </span>
                        <span className="text-[11px]">
                          {total === 0 ? (
                            <span className="text-slate-400">
                              Chưa nhập tổng tiền
                            </span>
                          ) : percent === 100 ? (
                            <span className="text-emerald-500 font-bold">
                              ✓ Đã thanh toán đủ
                            </span>
                          ) : remaining > 0 ? (
                            <span className="text-amber-500 font-semibold">
                              Còn nợ: <strong>{formatVND(remaining)}</strong>
                            </span>
                          ) : (
                            <span className="text-rose-500">
                              Chưa thanh toán
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Thanh Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent === 100
                              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                              : percent > 0
                                ? "bg-gradient-to-r from-indigo-500 to-emerald-400"
                                : "bg-slate-300 dark:bg-slate-600"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Trạng thái đơn & Ngày lên đơn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Trạng thái đơn hàng
                  </label>
                  <select
                    value={custForm.status || "ORDERED"}
                    onChange={(e) =>
                      setCustForm({
                        ...custForm,
                        status: e.target.value as OrderStatusType,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500/40 outline-none cursor-pointer"
                  >
                    {Object.entries(ORDER_STATUS_CONFIG).map(
                      ([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ngày lên đơn
                  </label>
                  <input
                    type="date"
                    value={custForm.orderDate}
                    onChange={(e) =>
                      setCustForm({ ...custForm, orderDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Ghi chú cho khách hàng này
                </label>
                <textarea
                  value={custForm.note || ""}
                  onChange={(e) =>
                    setCustForm({ ...custForm, note: e.target.value })
                  }
                  placeholder="Ghi chú thêm: Hàng đặt riêng, giao giờ hành chính..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none resize-none"
                />
              </div>
            </form>

            {/* Sub-modal Fixed Bottom Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                form="customer-submodal-form"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:opacity-95 shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 transition-all"
              >
                {editingCustomerIndex !== null
                  ? "Cập Nhật Khách Hàng"
                  : "Thêm Vào Đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM ẢNH PHÓNG TO TOÀN MÀN HÌNH */}
      {previewFullImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewFullImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewFullImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-lg backdrop-blur-sm border border-slate-700"
              title="Đóng xem ảnh"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={getFullImageUrl(previewFullImage)}
              alt="Ảnh phóng to"
              className="max-h-[82vh] w-auto max-w-full object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};
