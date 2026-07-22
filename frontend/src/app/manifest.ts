import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FinFlow - Quản Lý Chi Tiêu Cá Nhân',
    short_name: 'FinFlow',
    description: 'Ứng dụng quản lý thu chi, ví tài chính, hạn mức ngân sách & báo cáo thông minh.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0f19',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
