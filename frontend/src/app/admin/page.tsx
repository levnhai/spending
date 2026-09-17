import { Suspense } from 'react';
import { AdminPageView } from '@/views/admin';

export const metadata = {
  title: 'Quản Lý Người Dùng | Spending PRO',
  description: 'Quản lý danh sách người dùng, phân quyền và trạng thái hoạt động',
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
