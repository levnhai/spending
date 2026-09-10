'use client';

import React, { useEffect } from 'react';

export const PwaRegister: React.FC = () => {
  useEffect(() => {
    // Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('PWA ServiceWorker registered successfully:', reg.scope))
        .catch((err) => console.error('PWA ServiceWorker registration failed:', err));
    }
  }, []);

  return null;
};
