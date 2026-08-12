'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatVND } from '@/shared/lib/formatters';
import { useUserStore } from '@/entities/user/useUserStore';

interface AmountDisplayProps {
  amount: number;
  prefix?: string;
  className?: string;
  iconClassName?: string;
  showEye?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  prefix = '',
  className = '',
  iconClassName = 'w-3.5 h-3.5',
  showEye = true,
}) => {
  const globalShowAmount = useUserStore((s) => s.showAmount);
  const [localVisible, setLocalVisible] = useState<boolean | null>(null);

  const isVisible = localVisible !== null ? localVisible : globalShowAmount;

  return (
    <span className="inline-flex items-center gap-1.5 max-w-full">
      <span className={className}>
        {prefix}
        {isVisible ? formatVND(amount) : '••••••••'}
      </span>
      {showEye && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setLocalVisible(!isVisible);
          }}
          className="p-1 text-slate-400 hover:text-emerald-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shrink-0"
          title={isVisible ? 'Ẩn số tiền này' : 'Hiện số tiền này'}
        >
          {isVisible ? <Eye className={iconClassName} /> : <EyeOff className={iconClassName} />}
        </button>
      )}
    </span>
  );
};
