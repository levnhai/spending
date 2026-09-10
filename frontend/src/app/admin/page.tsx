import { Suspense } from 'react';
import { AdminPageView } from '@/views/admin';

export const metadata = {
  title: 'Quản Trị Hệ Thống | Spending PRO',
  description: 'Bảng quản trị hệ thống và người dùng',
};

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminPageView />
    </Suspense>
  );
}
