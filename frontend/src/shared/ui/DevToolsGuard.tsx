'use client';

import { useEffect } from 'react';

/**
 * Component bảo vệ chống F12, chuột phải (Inspect Element) và các phím tắt mở DevTools
 */
export const DevToolsGuard: React.FC = () => {
  useEffect(() => {
    // Cho phép mở DevTools và chuột phải trong môi trường phát triển (development)
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // 1. Chặn phím tắt mở DevTools / View Source
    const handleKeyDown = (e: KeyboardEvent) => {
      // Phím F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Tổ hợp Ctrl + Shift + I / J / C (Inspect / Console)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' ||
          e.key === 'i' ||
          e.key === 'J' ||
          e.key === 'j' ||
          e.key === 'C' ||
          e.key === 'c')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Tổ hợp Ctrl + U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Tổ hợp Ctrl + S (Lưu trang HTML)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 2. Chặn chuột phải (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 3. Khóa Debugger vô tận nếu người dùng cố tình mở DevTools từ trình duyệt (Production mode)
    let intervalId: NodeJS.Timeout | null = null;
    if (process.env.NODE_ENV === 'production') {
      intervalId = setInterval(() => {
        try {
          // Kích hoạt breakpoint nếu có DevTools đang bật
          const before = performance.now();
          // eslint-disable-next-line no-debugger
          debugger;
          const after = performance.now();
          if (after - before > 100) {
            // DevTools đang được mở
            console.clear();
          }
        } catch (_) {}
      }, 1000);
    }

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return null;
};
