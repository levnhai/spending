import { Suspense } from 'react';
import { OrdersPageView } from '@/views/orders';

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang tải đơn hàng...</div>}>
      <OrdersPageView />
    </Suspense>
  );
}
