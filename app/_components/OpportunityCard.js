'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowTrendingUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import OpportunityDetailsModal from './OpportunityDetailsModal';

export default function OpportunityCard({ opportunity }) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
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
    is_featured,
  } = opportunity;

  // Refined Status Palette
  const statusStyles = {
    active: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200',
    funded: 'bg-sky-600 text-white shadow-sm shadow-sky-200',
    closed: 'bg-slate-700 text-white',
    inactive: 'bg-slate-300 text-slate-700',
  };

  const typeLabel = type?.replace('_', ' ') || 'Investment';

  return (
    <div className="group flex flex-col bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
      {/* 🔹 IMAGE SECTION */}
      <div className="relative w-full h-32 sm:h-36 lg:h-32 xl:h-40 overflow-hidden bg-slate-100 shrink-0">
        <Image
          src={image_url || '/logo.png'}
          fill
          alt={name}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 pointer-events-none">
          {is_featured && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-black text-xs font-black uppercase tracking-wider shadow-sm">
              <StarIcon className="h-3 w-3" />
              Featured
            </div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-black uppercase tracking-wider shadow-sm border border-white">
            <ShieldCheckIcon className="h-3 w-3 text-blue-600" />
            {typeLabel}
          </div>
        </div>

        <div
          className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest ${
            statusStyles[status] || statusStyles.inactive
          }`}
        >
          {status}
        </div>
      </div>

      {/* 🔹 CONTENT SECTION */}
      <div className="p-3.5 sm:p-4 xl:p-5 flex flex-col flex-1 justify-between min-h-0">
        <div>
          <h3 className="text-sm sm:text-base xl:text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors duration-200 line-clamp-1">
            {name}
          </h3>

          <p className="mt-1 xl:mt-1.5 text-xs xl:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {description ||
              'Comprehensive market analysis and growth strategy for this specialized asset.'}
          </p>
        </div>

        {/* 🔹 METRICS GRID */}
        <div className="mt-2.5 xl:mt-3.5 space-y-1.5 xl:space-y-2 border-t border-slate-100/90 pt-2.5 xl:pt-3">
          <div className="flex items-center justify-between text-xs xl:text-sm">
            <div className="flex items-center gap-1.5 xl:gap-2 text-slate-600">
              <div className="p-1 xl:p-1.5 bg-emerald-50 rounded-lg">
                <CurrencyDollarIcon className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-emerald-600" />
              </div>
              <span className="font-medium text-xs text-slate-500">
                Minimum
              </span>
            </div>
            <span className="font-bold text-slate-900 text-xs xl:text-sm">
              ${minimum_investment ? Number(minimum_investment).toLocaleString() : '0'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs xl:text-sm">
            <div className="flex items-center gap-1.5 xl:gap-2 text-slate-600">
              <div className="p-1 xl:p-1.5 bg-blue-50 rounded-lg">
                <ArrowTrendingUpIcon className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-blue-600" />
              </div>
              <span className="font-medium text-xs text-slate-500">
                Expected Return
              </span>
            </div>
            <span className="font-bold text-blue-600 text-xs xl:text-sm">
              +{expected_return}%
            </span>
          </div>

          <div className="flex items-center justify-between text-xs xl:text-sm">
            <div className="flex items-center gap-1.5 xl:gap-2 text-slate-600">
              <div className="p-1 xl:p-1.5 bg-purple-50 rounded-lg">
                <ClockIcon className="h-3.5 w-3.5 xl:h-4 xl:w-4 text-purple-600" />
              </div>
              <span className="font-medium text-xs text-slate-500">
                Term
              </span>
            </div>
            <span className="font-bold text-slate-900 text-xs xl:text-sm">
              {duration_months ? `${duration_months} Months` : 'Flexible'}
            </span>
          </div>
        </div>
      </div>

      {/* 🔹 FOOTER ACTION */}
      <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 xl:px-5 xl:pb-5 pt-0">
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          onMouseEnter={() => router.prefetch(`/opportunities/${id}`)}
          className="flex items-center justify-center gap-1.5 xl:gap-2 w-full py-2 xl:py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.12em] bg-slate-900 text-white hover:bg-blue-600 transition-all duration-300 shadow-xs group-hover:shadow-blue-200 active:scale-95 cursor-pointer"
        >
          <span>View Details</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 🔹 INSTANT IN-PAGE DETAILS MODAL */}
      {showDetails && (
        <OpportunityDetailsModal
          opportunity={opportunity}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}
