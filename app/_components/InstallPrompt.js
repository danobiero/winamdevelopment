'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import logo from '@/public/logo.png';
import {
  ArrowDownTrayIcon,
  XMarkIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

const DECLINED_KEY = 'winam_install_declined';
const LEGACY_KEY = 'WINAM_install_dismissed';
const INSTALLED_KEY = 'winam_app_installed';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === 'undefined') return;

    // Check if user already declined, dismissed, or installed
    const hasDeclined =
      localStorage.getItem(DECLINED_KEY) === 'true' ||
      localStorage.getItem(LEGACY_KEY) === 'true' ||
      localStorage.getItem(INSTALLED_KEY) === 'true';

    // Check if app is already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (hasDeclined || isStandalone) {
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua) && !window.MSStream;
    const androidDevice = /android/.test(ua);
    const desktopDevice = !iosDevice && !androidDevice;

    setIsIOS(iosDevice);
    setIsDesktop(desktopDevice);

    // Capture standard PWA install prompt (Chrome, Edge, Android, etc.)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Polite delay before showing to first-time visitors
      const timer = setTimeout(() => {
        const stillDeclined =
          localStorage.getItem(DECLINED_KEY) === 'true' ||
          localStorage.getItem(LEGACY_KEY) === 'true' ||
          localStorage.getItem(INSTALLED_KEY) === 'true';

        if (!stillDeclined) {
          setShow(true);
        }
      }, 1500);

      return () => clearTimeout(timer);
    };

    // If installed via browser UI or after prompt, mark as done
    const handleAppInstalled = () => {
      try {
        localStorage.setItem(DECLINED_KEY, 'true');
        localStorage.setItem(INSTALLED_KEY, 'true');
      } catch (err) {}
      setShow(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari does not support beforeinstallprompt
    if (iosDevice && !isStandalone && !hasDeclined) {
      const iosTimer = setTimeout(() => {
        const stillDeclined =
          localStorage.getItem(DECLINED_KEY) === 'true' ||
          localStorage.getItem(LEGACY_KEY) === 'true';
        if (!stillDeclined) {
          setShow(true);
        }
      }, 2000);

      return () => {
        clearTimeout(iosTimer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // When user declines: record choice so they are never asked again
  const handleDecline = () => {
    try {
      localStorage.setItem(DECLINED_KEY, 'true');
      localStorage.setItem(LEGACY_KEY, 'true');
    } catch (err) {}
    setShow(false);
    setDeferredPrompt(null);
  };

  // When user clicks the install button (Chromium / Android / Desktop)
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult && choiceResult.outcome === 'accepted') {
        try {
          localStorage.setItem(INSTALLED_KEY, 'true');
          localStorage.setItem(DECLINED_KEY, 'true');
        } catch (err) {}
      } else {
        // User cancelled in native dialog: counts as decline, do not ask again
        try {
          localStorage.setItem(DECLINED_KEY, 'true');
        } catch (err) {}
      }
    } catch (err) {
      console.error('PWA install error:', err);
      try {
        localStorage.setItem(DECLINED_KEY, 'true');
      } catch (storageErr) {}
    } finally {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  if (!isMounted || !show) return null;

  return (
    <div
      role="dialog"
      aria-label="Save WINAM App"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] max-w-sm w-auto sm:w-96 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-slate-200/90 p-4 sm:p-5 text-slate-800">
        {/* Header row with logo, title, and close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
              <Image
                src={logo}
                alt="WINAM Logo"
                fill
                className="object-contain p-0.5"
                sizes="48px"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">
                WINAM Development Group
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {isDesktop ? 'Save WINAM to Desktop' : 'Save to Home Screen'}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDecline}
            aria-label="Decline and close"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Informational description */}
        <div className="mt-3">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isDesktop
              ? 'Save the WINAM icon to your desktop for quick, one-click access and an optimal experience.'
              : 'Add the WINAM icon to your home screen for quick, one-tap access anytime.'}
          </p>

          {/* iOS Safari Instructions */}
          {isIOS && (
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs shrink-0">
                  1
                </span>
                <span>
                  Tap the <strong className="font-semibold text-slate-900">Share</strong> button{' '}
                  <ShareIcon className="w-3.5 h-3.5 inline text-blue-600 align-text-bottom" /> in Safari.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs shrink-0">
                  2
                </span>
                <span>
                  Select <strong className="font-semibold text-slate-900">Add to Home Screen</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center gap-2.5">
          {isIOS ? (
            <button
              onClick={handleDecline}
              className="flex-1 bg-[#000033] hover:bg-blue-950 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-sm text-center"
            >
              Got it
            </button>
          ) : (
            <button
              onClick={handleInstallClick}
              disabled={!deferredPrompt}
              className="flex-1 bg-[#000033] hover:bg-blue-950 text-white font-semibold py-2.5 px-3.5 rounded-xl text-xs sm:text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="w-4 h-4 shrink-0" />
              <span>{isDesktop ? 'Save to Desktop' : 'Save to Home Screen'}</span>
            </button>
          )}

          <button
            onClick={handleDecline}
            className="px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
