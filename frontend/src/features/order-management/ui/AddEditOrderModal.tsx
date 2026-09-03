'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import {
  Order,
  OrderCustomer,
  CreateOrderPayload,
  OrderStatusType,
  PaymentStatusType,
  ORDER_STATUS_CONFIG,
  orderApi,
} from '@/entities/order';
import { formatVND, formatNumberWithSpaces, parseFormattedNumber } from '@/shared/lib/formatters';

interface AddEditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderToEdit?: Order | null;
}

const createEmptyCustomer = (): OrderCustomer => ({
  name: '',
  phone: '',
  facebookUrl: '',
  amount: 0,
  paidAmount: 0,
  orderDate: new Date().toISOString().split('T')[0],
  status: 'ORDERED',
  paymentStatus: 'UNPAID',
  note: '',
});

export const AddEditOrderModal: React.FC<AddEditOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  orderToEdit,
}) => {
  const isEditing = Boolean(orderToEdit);

  const [title, setTitle] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [costPriceStr, setCostPriceStr] = useState('');
  const [shippingFeeStr, setShippingFeeStr] = useState('');
  const [customers, setCustomers] = useState<OrderCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sub-modal state for Customer
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomerIndex, setEditingCustomerIndex] = useState<number | null>(null);
  const [custForm, setCustForm] = useState<OrderCustomer>(createEmptyCustomer());
  const [custAmountStr, setCustAmountStr] = useState('');
  const [custPaidAmountStr, setCustPaidAmountStr] = useState('');
  const [custError, setCustError] = useState('');

  useEffect(() => {
    if (orderToEdit) {
      setTitle(orderToEdit.title || '');
      setOrderCode(orderToEdit.orderCode || '');
      setImageUrl(orderToEdit.imageUrl || '');
      setCostPriceStr(orderToEdit.costPrice ? formatNumberWithSpaces(orderToEdit.costPrice) : '');
      setShippingFeeStr(orderToEdit.shippingFee ? formatNumberWithSpaces(orderToEdit.shippingFee) : '');

      if (orderToEdit.customers && orderToEdit.customers.length > 0) {
        setCustomers(
          orderToEdit.customers.map((c) => ({
            name: c.name || '',
            phone: c.phone || '',
            facebookUrl: c.facebookUrl || '',
            amount: c.amount || 0,
            paidAmount: c.paidAmount || 0,
            orderDate: c.orderDate
              ? new Date(c.orderDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            status: c.status || 'ORDERED',
            paymentStatus: c.paymentStatus || 'UNPAID',
            note: c.note || '',
          })),
        );
      } else if (orderToEdit.customerName) {
        setCustomers([
          {
            name: orderToEdit.customerName,
            phone: orderToEdit.customerPhone || '',
            facebookUrl: '',
            amount: orderToEdit.totalAmount || 0,
            paidAmount: orderToEdit.paidAmount || 0,
            orderDate: orderToEdit.orderDate
              ? new Date(orderToEdit.orderDate).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            status: orderToEdit.status || 'ORDERED',
            paymentStatus: orderToEdit.paymentStatus || 'UNPAID',
            note: orderToEdit.note || '',
          },
        ]);
      } else {
        setCustomers([]);
      }
    } else {
      setTitle('');
      setOrderCode('');
      setImageUrl('');
      setCostPriceStr('');
      setShippingFeeStr('');
      setCustomers([]);
    }
    setError('');
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
  const calculatedRemaining = Math.max(0, calculatedTotalAmount - calculatedPaidAmount);
  const estimatedProfit = calculatedTotalAmount - shippingFee - costPrice;

  // Mở Modal Thêm mới khách hàng
  const handleOpenAddCustomerModal = () => {
    setEditingCustomerIndex(null);
    setCustForm(createEmptyCustomer());
    setCustAmountStr('');
    setCustPaidAmountStr('');
    setCustError('');
    setIsCustomerModalOpen(true);
  };

  // Mở Modal Chỉnh sửa khách hàng
  const handleOpenEditCustomerModal = (index: number) => {
    setEditingCustomerIndex(index);
    const target = customers[index];
    setCustForm({ ...target });
    setCustAmountStr(target.amount ? formatNumberWithSpaces(target.amount) : '');
    setCustPaidAmountStr(target.paidAmount ? formatNumberWithSpaces(target.paidAmount) : '');
    setCustError('');
    setIsCustomerModalOpen(true);
  };

  // Lưu khách hàng từ Sub-modal
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custForm.name.trim()) {
      setCustError('Vui lòng nhập họ và tên khách hàng');
      return;
    }

    const total = parseFormattedNumber(custAmountStr);
    const paid = parseFormattedNumber(custPaidAmountStr);
    let paymentStatus: PaymentStatusType = custForm.paymentStatus || 'UNPAID';

    if (paid >= total && total > 0) {
      paymentStatus = 'PAID';
    } else if (paid > 0) {
      paymentStatus = 'PARTIAL';
    } else {
      paymentStatus = 'UNPAID';
    }

    const newCustomerData: OrderCustomer = {
      ...custForm,
      name: custForm.name.trim(),
      phone: custForm.phone?.trim() || '',
      facebookUrl: custForm.facebookUrl?.trim() || '',
      amount: total,
      paidAmount: paid,
      paymentStatus,
      status: custForm.status || 'ORDERED',
      orderDate: custForm.orderDate || new Date().toISOString().split('T')[0],
      note: custForm.note?.trim() || '',
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
      setError('Vui lòng nhập Tên đơn hàng');
      return;
    }

    if (customers.length === 0) {
      setError('Vui lòng thêm ít nhất 1 khách hàng vào đơn hàng');
      return;
    }

    setLoading(true);
    setError('');

    const payload: CreateOrderPayload = {
      title: title.trim(),
      orderCode: orderCode.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      costPrice: Number(costPrice) || 0,
      shippingFee: Number(shippingFee) || 0,
      customers: customers.map((c) => ({
        ...c,
        orderDate: c.orderDate ? new Date(c.orderDate).toISOString() : new Date().toISOString(),
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
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu đơn hàng');
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
                  {isEditing ? 'Chỉnh Sửa Đơn Hàng' : 'Tạo Đơn Hàng Mới'}
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
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-semibold">
                {error}
              </div>
            )}

            {/* Thông tin cơ bản: Tên đơn & Mã đơn */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên đơn hàng / Sản phẩm <span className="text-rose-500">*</span>
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
                  maxLength={18}
                  value={costPriceStr}
                  onChange={(e) => setCostPriceStr(formatNumberWithSpaces(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Giá nhập/vốn của sản phẩm</span>
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
                  maxLength={18}
                  value={shippingFeeStr}
                  onChange={(e) => setShippingFeeStr(formatNumberWithSpaces(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Tiền ship trả cho bên vận chuyển</span>
              </div>
            </div>

            {/* Image URL & Preview */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Hình ảnh sản phẩm / Chứng từ (URL)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>
              </div>
              {imageUrl && (
                <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative bg-slate-100 dark:bg-slate-800">
                  <img
                    src={imageUrl}
                    alt="Xem trước"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
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
                  <p className="text-[11px] text-slate-400">
                    Thêm nhiều khách chung 1 chuyến hàng hoặc người mua lẻ
                  </p>
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
                  <p className="text-xs text-slate-500">Chưa có khách hàng nào trong đơn này</p>
                  <button
                    type="button"
                    onClick={handleOpenAddCustomerModal}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                  >
                    + Thêm Khách Hàng Đầu Tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {customers.map((c, idx) => {
                    const statusConfig = ORDER_STATUS_CONFIG[c.status || 'ORDERED'] || ORDER_STATUS_CONFIG.ORDERED;
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
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {c.name}
                              </p>
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
                              Đã thu: <strong className="text-emerald-500">{formatVND(cPaid)}</strong>
                              {cRemaining > 0 && (
                                <span className="text-amber-500 ml-1">| Nợ: {formatVND(cRemaining)}</span>
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
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Doanh Thu</span>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {formatVND(calculatedTotalAmount)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tiền Vốn</span>
                  <span className="font-extrabold text-sm text-amber-500">
                    {formatVND(costPrice)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Phí Ship</span>
                  <span className="font-extrabold text-sm text-blue-500">
                    {formatVND(shippingFee)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Lợi Nhuận Dự Kiến</span>
                  <span className={`font-extrabold text-sm ${estimatedProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
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
                {loading ? 'Đang lưu...' : isEditing ? 'Lưu Thay Đổi' : 'Tạo Đơn Hàng'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SUB-MODAL: THÊM / SỬA KHÁCH HÀNG */}
      {isCustomerModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsCustomerModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingCustomerIndex !== null
                    ? `Chỉnh Sửa Khách Hàng #${editingCustomerIndex + 1}`
                    : 'Thêm Khách Hàng Vào Đơn'}
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

            <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
              {custError && (
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 font-semibold">
                  {custError}
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
                    onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
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
                    value={custForm.phone || ''}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
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
                    value={custForm.facebookUrl || ''}
                    onChange={(e) => setCustForm({ ...custForm, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/username-khach-hang"
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Phân tách: Tổng tiền & Tiền đã thanh toán */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tổng tiền cần thanh toán (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={custAmountStr}
                    onChange={(e) => setCustAmountStr(formatNumberWithSpaces(e.target.value))}
                    placeholder="0"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Tiền khách đã thanh toán (VNĐ)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={custPaidAmountStr}
                    onChange={(e) => setCustPaidAmountStr(formatNumberWithSpaces(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Trạng thái đơn & Ngày lên đơn */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Trạng thái đơn hàng
                  </label>
                  <select
                    value={custForm.status || 'ORDERED'}
                    onChange={(e) => setCustForm({ ...custForm, status: e.target.value as OrderStatusType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500/40 outline-none cursor-pointer"
                  >
                    {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Ngày lên đơn
                  </label>
                  <input
                    type="date"
                    value={custForm.orderDate}
                    onChange={(e) => setCustForm({ ...custForm, orderDate: e.target.value })}
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
                  value={custForm.note || ''}
                  onChange={(e) => setCustForm({ ...custForm, note: e.target.value })}
                  placeholder="Ghi chú thêm: Hàng đặt riêng, giao giờ hành chính..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500/40 outline-none resize-none"
                />
              </div>

              {/* Sub-modal actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  {editingCustomerIndex !== null ? 'Cập Nhật Khách Hàng' : 'Thêm Vào Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
