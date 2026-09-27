'use client';

import Image from 'next/image';
import logo from '@/public/logo.png';
import { useEffect, useState } from 'react';

export default function InstallWINAMModal({ trigger = false }) {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const closeModal = () => {
    localStorage.setItem('WINAM_install_dismissed', 'true');
    setShow(false);
  };

  // Detect platform + capture install event ONCE
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);

    setIsIOS(ios);
    setIsAndroid(android);

    const handler = (e) => {
      console.log('INSTALL EVENT READY')
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Show modal only when install is actually possible
 useEffect(() => {
   if (!trigger) return;

   const dismissed = localStorage.getItem('WINAM_install_dismissed');

   const isStandalone =
     typeof window !== 'undefined' &&
     (window.matchMedia('(display-mode: standalone)').matches ||
       navigator.standalone === true);

   const canShow = deferredPrompt || isIOS;

   if (!dismissed && !isStandalone && canShow) {
     const t = setTimeout(() => setShow(true), 1500);
     return () => clearTimeout(t);
   }
 }, [trigger, deferredPrompt, isIOS]);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) {
      alert('Install not ready yet. Please try again shortly.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') closeModal();

    setDeferredPrompt(null);
  };

  const handleIOSShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'WINAM',
          text: 'Install WINAM on your home screen',
          url: window.location.href,
        });
      } catch {}
    }
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <Image
              src={logo}
              alt="WINAM Logo"
              fill
              className="object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900">Install WINAM</h2>
          <p className="mt-2 text-sm text-gray-500">
            Add WINAM to your home screen for faster access.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {isAndroid && deferredPrompt && (
            <button
              onClick={handleAndroidInstall}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold"
            >
              Install Now
            </button>
          )}

          {/* IOS UI: Instructional Guide */}
          {isIOS && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold">
                  1
                </div>
                <p className="text-sm text-gray-700">
                  Tap the <span className="font-bold">Share</span> button in the
                  bottom browser menu.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold">
                  2
                </div>
                <p className="text-sm text-gray-700">
                  Scroll down and select{' '}
                  <span className="font-bold">Add to Home Screen</span>.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={closeModal}
            className="w-full py-3 text-sm text-gray-400"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
