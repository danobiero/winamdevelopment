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

  useEffect(() => {
    if (!trigger) return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);

    // Check if already installed
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true;

    const dismissed = localStorage.getItem('praxida_install_dismissed');

    setIsIOS(ios);
    setIsAndroid(android);

    if ((ios || android) && !isStandalone && !dismissed) {
      // Delay to ensure user is settled
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [trigger]);

  // Handle the iOS Share API trigger
  const handleIOSShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Praxida App',
          text: 'Install Praxida to your home screen',
          url: window.location.href,
        });
      } catch (err) {
        console.log('User cancelled share or error:', err);
      }
    }
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') closeModal();
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          {/* LOGO PLACEHOLDER */}
          <div className="w-16 h-16 bg-logo-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Image
                src={logo} 
                alt="Praxida Logo"
                fill
                className="object-contain rounded-2xl"
                priority
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900">Install Praxida</h2>
          <p className="mt-2 text-sm text-gray-500">
            Get the full app experience on your home screen for faster access to
            PRAXIDA.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {isIOS && (
            <>
              <button
                onClick={handleIOSShare}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <span>Tap to Open Share</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </button>
              <p className="text-[11px] text-center text-gray-400">
                After clicking, scroll down and select{' '}
                <span className="font-bold text-gray-600">
                  "Add to Home Screen"
                </span>
              </p>
            </>
          )}

          {isAndroid && (
            <button
              onClick={handleAndroidInstall}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-transform active:scale-95"
            >
              Install Now
            </button>
          )}

          <button
            onClick={closeModal}
            className="w-full py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
          >
            Not now, thanks
          </button>
        </div>
      </div>
    </div>
  );
}
