'use client';

import React, { useEffect, useState } from 'react';
import './globals.css';
import { Sidebar } from '@/widgets/navigation/Sidebar';
import { BottomNav } from '@/widgets/navigation/BottomNav';
import { useUserStore } from '@/entities/user/useUserStore';
import { AuthPageView } from '@/views/auth/AuthPageView';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { PwaRegister } from '@/shared/ui/PwaRegister';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, token, initAuth } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  return (
    <html lang="vi" className="dark">
      <head>
        <title>FinFlow - Quản Lý Chi Tiêu Cá Nhân</title>
        <meta name="description" content="Ứng dụng Quản lý chi tiêu cá nhân thông minh, báo cáo trực quan và hỗ trợ đa ví tài chính." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#10b981" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinFlow" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <PwaRegister />
        
        {!mounted ? (
          <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !token || !user ? (
          <AuthPageView onSuccess={() => {}} />
        ) : (
          <>
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
        )}
      </body>
    </html>
  );
}
