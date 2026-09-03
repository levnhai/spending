'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { OrderStatusType, ORDER_STATUS_CONFIG, orderApi } from '@/entities/order';

interface OrderStatusDropdownProps {
  orderId: string;
  currentStatus: OrderStatusType;
  onStatusChanged: (newStatus: OrderStatusType) => void;
}

export const OrderStatusDropdown: React.FC<OrderStatusDropdownProps> = ({
  orderId,
  currentStatus,
  onStatusChanged,
}) => {
  const [loading, setLoading] = useState(false);

  const currentConfig = ORDER_STATUS_CONFIG[currentStatus] || ORDER_STATUS_CONFIG.ORDERED;

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatusType;
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      await orderApi.updateStatus(orderId, newStatus);
      onStatusChanged(newStatus);
    } catch (err) {
      alert('Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Visual Badge styled based on current status */}
      <div
        className={`relative flex items-center gap-1.5 pl-2.5 pr-6 py-1 rounded-full text-[11px] font-bold border transition-all shadow-sm ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} ${
          loading ? 'opacity-50' : 'hover:opacity-90'
        }`}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: currentConfig.color }}
        />
        <span className="whitespace-nowrap">
          {loading ? 'Đang lưu...' : currentConfig.label}
        </span>
        <ChevronDown className="w-3 h-3 opacity-60 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />

        {/* Invisible native select overlay that never gets clipped by table overflow */}
        <select
          value={currentStatus}
          onChange={handleChange}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-slate-900 dark:text-white"
          title="Bấm để đổi trạng thái đơn hàng"
        >
          {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold">
              {config.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
