'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận thao tác',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận xóa',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}) => {
  // Đóng modal khi nhấn phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5',
          icon: <Trash2 className="w-6 h-6 text-rose-500" />,
          btnConfirm:
            'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 active:scale-95',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500 ring-8 ring-amber-500/5',
          icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
          btnConfirm:
            'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25 active:scale-95',
        };
      case 'info':
      default:
        return {
          iconBg: 'bg-indigo-500/10 text-indigo-500 ring-8 ring-indigo-500/5',
          icon: <Info className="w-6 h-6 text-indigo-500" />,
          btnConfirm:
            'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95',
        };
    }
  };

  const styles = getVariantStyles();

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className={`p-4 rounded-2xl mb-4 ${styles.iconBg}`}>
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            {title}
          </h3>

          {/* Message */}
          <div className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-6">
            {message}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 px-4 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${styles.btnConfirm} disabled:opacity-50`}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
};
