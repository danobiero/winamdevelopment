'use client';

import Image from 'next/image';
import logo from '@/public/logo.png';
import { useEffect, useState } from 'react';

export default function InstallPraxidaModal({ trigger = false }) {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const closeModal = () => {
    localStorage.setItem('praxida_install_dismissed', 'true');
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
      console.log('INSTALL EVENT READY');
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Show modal only when install is actually possible
  useEffect(() => {
    if (!trigger) return;

    const dismissed = localStorage.getItem('praxida_install_dismissed');

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true;

    if (!dismissed && !isStandalone) {
      if (deferredPrompt || isIOS) {
        setTimeout(() => setShow(true), 1500);
      }
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
          title: 'Praxida',
          text: 'Install Praxida on your home screen',
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
              alt="Praxida Logo"
              fill
              className="object-contain"
            />
          </div>

          <h2 className="text-xl font-bold text-gray-900">Install Praxida</h2>
          <p className="mt-2 text-sm text-gray-500">
            Add Praxida to your home screen for faster access.
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

          {isIOS && (
            <>
              <button
                onClick={handleIOSShare}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold"
              >
                Open Share Menu
              </button>
              <p className="text-[11px] text-center text-gray-400">
                Tap <b>Add to Home Screen</b>
              </p>
            </>
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
