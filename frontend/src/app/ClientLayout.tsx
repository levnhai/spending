'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/widgets/navigation/Sidebar';
import { BottomNav } from '@/widgets/navigation/BottomNav';
import { useUserStore } from '@/entities/user/useUserStore';
import { APP_NAVIGATION_ITEMS } from '@/shared/config/navigation.config';
import { AuthPageView } from '@/views/auth/AuthPageView';
import { AddTransactionModal } from '@/features/add-transaction/AddTransactionModal';
import { AddEditOrderModal } from '@/features/order-management';
import { PwaRegister } from '@/shared/ui/PwaRegister';
import { DevToolsGuard } from '@/shared/ui/DevToolsGuard';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, role, initAuth } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);

  const userRole = role || user?.role || 'PERSONAL';

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  // Route Guard: Tự động chuyển về /dashboard nếu truy cập trang không thuộc Role hiện tại
  useEffect(() => {
    if (!mounted || !token || !user) return;

    const currentItem = APP_NAVIGATION_ITEMS.find((item) => {
      if (item.href === '/dashboard') return pathname === '/dashboard';
      return pathname.startsWith(item.href);
    });

    if (currentItem && currentItem.allowedRoles) {
      if (!currentItem.allowedRoles.includes(userRole)) {
        // Trang không thuộc role hiện tại -> Tự động chuyển về Dashboard
        router.replace('/dashboard');
      }
    }
  }, [pathname, userRole, mounted, token, user, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-slate-400">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <>
        <DevToolsGuard />
        <AuthPageView onSuccess={() => {}} />
      </>
    );
  }

  const handleOpenBottomAdd = () => {
    if (userRole === 'SALES') {
      setIsAddOrderOpen(true);
    } else {
      setIsQuickAddOpen(true);
    }
  };

  return (
    <>
      {/* Thanh che chắn Safe Area Top (Status Bar) chống lọt nội dung khi cuộn */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top,0px)] bg-white dark:bg-slate-900 z-50 pointer-events-none" />

      <DevToolsGuard />
      <PwaRegister />
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

      <BottomNav onOpenQuickAdd={handleOpenBottomAdd} />

      {/* Modal Thêm Giao Dịch (Chế độ Cá Nhân) */}
      <AddTransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Modal Thêm Đơn Hàng Mới (Chế độ Bán Hàng) */}
      <AddEditOrderModal
        isOpen={isAddOrderOpen}
        onClose={() => setIsAddOrderOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
