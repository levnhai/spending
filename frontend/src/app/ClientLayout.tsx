'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/widgets/navigation/Sidebar';
import { BottomNav } from '@/widgets/navigation/BottomNav';
import { useUserStore } from '@/entities/user/useUserStore';
import { AuthPageView } from '@/views/auth/AuthPageView';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { PwaRegister } from '@/shared/ui/PwaRegister';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, token, initAuth } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <AuthPageView onSuccess={() => {}} />;
  }

  return (
    <>
      <PwaRegister />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      <BottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
