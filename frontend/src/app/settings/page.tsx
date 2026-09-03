import { Suspense } from 'react';
import { SettingsPageView } from '@/views/settings';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang tải cài đặt...</div>}>
      <SettingsPageView />
    </Suspense>
  );
}
