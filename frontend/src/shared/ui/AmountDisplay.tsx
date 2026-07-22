'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatVND } from '@/shared/lib/formatters';

interface AmountDisplayProps {
  amount: number;
  prefix?: string;
  className?: string;
  iconClassName?: string;
  defaultVisible?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  prefix = '',
  className = '',
  iconClassName = 'w-3.5 h-3.5',
  defaultVisible = false,
}) => {
  const [visible, setVisible] = useState(defaultVisible);

  return (
    <span className="inline-flex items-center gap-1.5 max-w-full">
      <span className={className}>
        {prefix}
        {visible ? formatVND(amount) : '••••••••'}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(!visible);
        }}
        className="p-1 text-slate-400 hover:text-emerald-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shrink-0"
        title={visible ? 'Ẩn số tiền này' : 'Hiện số tiền này'}
      >
        {visible ? <Eye className={iconClassName} /> : <EyeOff className={iconClassName} />}
      </button>
    </span>
  );
};
