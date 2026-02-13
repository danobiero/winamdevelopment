'use client';

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
    const mobile = ios || android;

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    const dismissed = localStorage.getItem('praxida_install_dismissed');

    setIsIOS(ios);
    setIsAndroid(android);

    if (mobile && !isStandalone && !dismissed) {
      setTimeout(() => setShow(true), 1500);
    }

    // Android install capture
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [trigger]);

  // ESC key support
  useEffect(() => {
    const esc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    closeModal();
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
      onClick={closeModal} // click outside closes
    >
      <div
        className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // prevent inside click closing
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
        >
          ✕
        </button>

        <div className="text-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Install Praxida
          </h2>
          <p className="text-sm text-gray-500">
            Add Praxida to your Home Screen for faster access
          </p>
        </div>

        {isIOS && (
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              <strong>1.</strong> Tap the Share button in Safari
            </p>
            <p>
              <strong>2.</strong> Scroll down
            </p>
            <p>
              <strong>3.</strong> Tap <strong>Add to Home Screen</strong>
            </p>

            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-blue-600 text-xs animate-bounce">
              ↑ Tap Share
            </div>
          </div>
        )}

        {isAndroid && deferredPrompt && (
          <button
            onClick={handleAndroidInstall}
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-medium"
          >
            Install App
          </button>
        )}

        <button
          onClick={closeModal}
          className="w-full mt-5 py-2 border rounded-lg text-gray-600"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
