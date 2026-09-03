'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; isAbove: boolean } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentConfig = ORDER_STATUS_CONFIG[currentStatus] || ORDER_STATUS_CONFIG.ORDERED;

  // Tính toán vị trí Popup tuyệt đối trên viewport (Fixed Coordinate)
  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 176; // 11rem (w-44)
    const menuHeight = 210; // Chiều cao ước tính của menu

    const spaceBelow = window.innerHeight - rect.bottom;
    const isAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    let left = rect.left + rect.width / 2 - menuWidth / 2;
    // Chống tràn lề trái / lề phải màn hình
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }

    const top = isAbove ? rect.top - menuHeight - 6 : rect.bottom + 6;

    setDropdownPos({ top, left, isAbove });
  };

  const handleToggle = () => {
    if (loading) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Click outside & scroll listener để đóng menu
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  const handleSelectStatus = async (newStatus: OrderStatusType) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(false);
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
    <>
      {/* Badge Button Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full text-[11px] font-bold border transition-all duration-200 shadow-sm ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} ${
          loading ? 'opacity-70 cursor-wait' : 'hover:opacity-95 hover:scale-[1.02] active:scale-95 cursor-pointer'
        }`}
        title="Bấm để chọn trạng thái mới"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-current" />
        ) : (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: currentConfig.color }}
          />
        )}
        <span className="whitespace-nowrap">
          {loading ? 'Đang lưu...' : currentConfig.label}
        </span>
        <ChevronDown
          className={`w-3 h-3 opacity-60 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Portal Menu được gắn vào document.body -> Không bao giờ bị table overflow cắt che */}
      {isOpen &&
        dropdownPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 99999,
            }}
            className="w-44 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150"
          >
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => {
              const isSelected = currentStatus === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectStatus(key as OrderStatusType)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="truncate">{config.label}</span>
                  </div>
                  {isSelected && (
                    <Check
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: config.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};
