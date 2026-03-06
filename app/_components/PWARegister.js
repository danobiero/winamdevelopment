'use client';
import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => 'Service Worker registered')
        .catch((err) => ('SW registration failed:', err));
    }
  }, []);

  return null;
}
