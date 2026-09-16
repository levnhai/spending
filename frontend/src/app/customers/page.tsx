import { Suspense } from 'react';
import { CustomersPageView } from '@/views/customers';

export const metadata = {
  title: 'Khách Hàng | Quản Lý Chi Tiêu & Bán Hàng',
  description: 'Quản lý danh bạ khách hàng, theo dõi công nợ và lịch sử đơn hàng cho Sales',
};

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">Đang tải danh sách khách hàng...</div>
      }
    >
      <CustomersPageView />
    </Suspense>
  );
}
