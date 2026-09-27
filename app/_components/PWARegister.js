'use client';
import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (!cancelled) console.log('SW registered:', reg.scope);
      })
      .catch((err) => {
        if (!cancelled) console.error('SW registration failed:', err);
      });

    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
