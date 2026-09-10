'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  Printer,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import { Order } from '@/entities/order';
import { formatVND } from '@/shared/lib/formatters';
import { getFullImageUrl } from '@/shared/lib/uploadApi';
import { exportOrdersPdf, printOrders } from '../lib/exportOrdersPdf';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Điền sẵn thông tin khách hàng từ danh sách đơn hàng đã chọn
  useEffect(() => {
    if (orders.length > 0) {
      const firstOrder = orders[0];
      const mainCust = firstOrder.customers?.[0];

      const name = mainCust?.name || firstOrder.customerName || '';
      const phone = mainCust?.phone || firstOrder.customerPhone || '';

      setCustomerName(name);
      setCustomerPhone(phone);
      setCustomerAddress('');
      setCustomerNote('');
    }
  }, [orders, isOpen]);

  if (!isOpen) return null;

  // Tính toán số liệu thống kê
  let totalQty = 0;
  let totalAmount = 0;
  let totalPaid = 0;

  const productRows = orders.map((order, index) => {
    const cust = order.customers?.[0];
    const qty = cust?.quantity || 1;
    const amount = Number(order.totalAmount) || 0;
    const paid = Number(order.paidAmount) || 0;
    const unitPrice = qty > 0 ? Math.round(amount / qty) : amount;

    totalQty += qty;
    totalAmount += amount;
    totalPaid += paid;

    return {
      stt: index + 1,
      orderCode: order.orderCode,
      title: order.title,
      imageUrl: order.imageUrl,
      qty,
      unitPrice,
      amount,
      note: order.note || cust?.note,
    };
  });

  const totalRemaining = Math.max(0, totalAmount - totalPaid);

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportOrdersPdf({
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          note: customerNote,
        },
        orders,
      });
      onClose();
    } catch (err: any) {
      alert('Không thể tạo file PDF. Vui lòng thử lại sau: ' + (err.message || ''));
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printOrders({
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          note: customerNote,
        },
        orders,
      });
    } catch (err: any) {
      alert('Không thể in phiếu: ' + (err.message || ''));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-[95vw] max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-sm">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Xuất Bảng Kê Đơn Hàng (PDF)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20">
                  {orders.length} đơn
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Xác nhận thông tin khách hàng và xem trước bảng sản phẩm trước khi xuất file PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* KHỐI THÔNG TIN KHÁCH HÀNG (DƯỚI HEADER) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Thông Tin Khách Hàng (In trên phiếu)
              </span>
              <span className="text-[11px] text-slate-400">
                Tự động điền từ đơn đã chọn, bạn có thể bổ sung địa chỉ
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Tên khách hàng
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Tên khách hàng"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Số điện thoại"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Địa chỉ nhận hàng
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Nhập địa chỉ giao nhận..."
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Ghi chú thêm (tùy chọn)
              </label>
              <div className="relative">
                <FileText className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Ghi chú giao hàng, lời dặn khách..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* TABLE SẢN PHẨM */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/90 dark:bg-slate-800/90 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-500" />
                Danh Sách Sản Phẩm
              </span>
              <span className="text-xs text-slate-400">
                Tổng cộng {productRows.length} sản phẩm ({totalQty} món)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                    <th className="py-2.5 px-4">Tên hàng</th>
                    <th className="py-2.5 px-3 text-center w-16">Ảnh</th>
                    <th className="py-2.5 px-3 text-center w-16">Số lượng</th>
                    <th className="py-2.5 px-4 text-right w-28">Đơn giá</th>
                    <th className="py-2.5 px-4 text-right w-32">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {productRows.map((row) => (
                    <tr
                      key={row.orderCode}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-400">
                        {row.stt}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {row.title}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {row.orderCode}
                        </div>
                        {row.note && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5 truncate max-w-sm">
                            • {row.note}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {row.imageUrl ? (
                          <img
                            src={getFullImageUrl(row.imageUrl)}
                            alt={row.title}
                            className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-700 mx-auto"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                            <ImageIcon className="w-4 h-4 opacity-40" />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white">
                        {row.qty}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-600 dark:text-slate-300">
                        {formatVND(row.unitPrice)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatVND(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* THỐNG KÊ TỔNG QUAN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Tổng số lượng
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {totalQty} món
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Tổng tiền hàng
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {formatVND(totalAmount)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Đã thu (đã trả)
              </span>
              <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatVND(totalPaid)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/20">
              <span className="text-[10px] sm:text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Còn nợ / Cần thu
              </span>
              <span className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400">
                {formatVND(totalRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting || isPrinting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700"
              title="In trực tiếp ra máy in hoặc Lưu dưới dạng PDF của trình duyệt"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang chuẩn bị in...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>In phiếu (Print)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting || isPrinting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tạo PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Tải file PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
