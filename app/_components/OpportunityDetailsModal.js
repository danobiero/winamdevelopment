'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  XMarkIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

export default function OpportunityDetailsModal({ opportunity, isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen || !opportunity) return null;

  const {
    id,
    name,
    description,
    image_url,
    type,
    status,
    minimum_investment,
    expected_return,
    duration_months,
    analysis,
    is_featured,
  } = opportunity;

  const safeImage =
    image_url && image_url.startsWith('http') ? image_url.trim() : '/logo.png';

  const typeLabel = type?.replace('_', ' ') || 'Investment';

  // Format analysis items
  let analysisList = [];
  if (Array.isArray(analysis)) {
    analysisList = analysis;
  } else if (typeof analysis === 'string' && analysis.trim()) {
    // If it's a newline or period-separated text
    analysisList = analysis
      .split(/\n|•/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (analysisList.length === 0) {
    analysisList = [
      'Comprehensive Market Due Diligence',
      'Targeted Capital Growth Strategy',
      `Target ROI: ${expected_return || 0}%`,
      'Institutional Risk Mitigation Protocols',
    ];
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 🔹 MODAL HEADER */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <ShieldCheckIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {name}
              </h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {typeLabel} Opportunity
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 🔹 SCROLLABLE CONTENT BODY */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">
          {/* Hero Banner with Badges */}
          <div className="relative w-full h-44 sm:h-56 md:h-64 rounded-2xl overflow-hidden bg-slate-100 shadow-inner shrink-0">
            <Image
              src={safeImage}
              fill
              alt={name}
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

            {/* Badges Overlay */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap gap-2">
              {is_featured && (
                <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-sm">
                  <StarIcon className="h-3.5 w-3.5" />
                  Featured Opportunity
                </span>
              )}
              <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-sm">
                Status: {status}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-black uppercase tracking-wider shadow-sm backdrop-blur-sm">
                {typeLabel}
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <CurrencyDollarIcon className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Min. Investment
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">
                ${minimum_investment ? Number(minimum_investment).toLocaleString() : '0'}
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <ArrowTrendingUpIcon className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Target Return
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-blue-600">
                +{expected_return}%
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <ClockIcon className="h-4 w-4 text-purple-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Duration
                </span>
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900">
                {duration_months ? `${duration_months} Months` : 'Flexible'}
              </p>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Executive Overview
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
              {description ||
                'Strategic growth opportunity structured through the WINAM capital ecosystem with institutional risk mitigation and proactive governance.'}
            </p>
          </div>

          {/* Analysis Breakdown */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-900">
              <AcademicCapIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-bold tracking-tight">
                Analysis & Growth Highlights
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {analysisList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium"
                >
                  <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 🔹 FOOTER ACTION BAR */}
        <div className="p-4 sm:px-7 sm:py-4 border-t border-slate-100 bg-slate-50/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <Link
            href={`/opportunities/${id}`}
            prefetch={true}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <span>Proceed to Invest</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
