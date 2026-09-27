'use client';

import Image from 'next/image';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CalendarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import TextExpander from './TextExpander';

export default function Opportunity({ opportunity }) {
  // 1. Destructure 'analysis' from the opportunity prop
  const {
    name,
    description,
    image_url,
    status,
    minimum_investment,
    expected_return,
    duration_months,
    analysis, // This matches your table schema: opportunities.analysis
  } = opportunity;

  const safeImage =
    image_url && image_url.startsWith('http') ? image_url.trim() : '/logo.png';

  // 2. Helper to ensure analysis is an array we can map over
  const analysisList = Array.isArray(analysis)
    ? analysis
    : [
        'Market Growth Potential',
        'Risk Mitigation Strategy',
        `Expected ROI: ${expected_return}%`,
      ];

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl overflow-visible shadow-sm mb-8 sm:mb-12 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-0">
        {/* LEFT side: The Image */}
        <div className="relative h-[200px] sm:h-[280px] md:h-[450px] m-3 sm:m-4 md:m-6">
          <Image
            src={safeImage}
            fill
            alt={name}
            className="object-cover rounded-2xl shadow-md"
            priority
          />
        </div>

        {/* RIGHT side: The Info */}
        <div className="p-4 sm:p-6 md:p-10 md:pl-2 relative">
          <div className="w-full md:w-auto md:min-w-[320px] max-w-full md:absolute md:-left-20 lg:-left-24 md:top-8 bg-slate-900 text-white px-4 py-3 sm:px-6 sm:py-3.5 md:px-10 md:py-4 rounded-xl md:rounded-md shadow-xl md:shadow-2xl z-20 mb-4 md:mb-0 block md:inline-block">
            <h1 className="text-lg sm:text-xl md:text-3xl font-bold tracking-tight">
              {name}
            </h1>
          </div>

          <div className="md:mt-24 space-y-4 sm:space-y-6">
            <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl">
              {description ||
                'Investment education and market analysis offered in specialized sessions.'}
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 text-slate-700">
                <UsersIcon className="h-5 w-5 text-slate-500" />
                <span className="text-base">
                  Status: <span className="font-bold capitalize">{status}</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-700">
                <CurrencyDollarIcon className="h-5 w-5 text-slate-500" />
                <span className="text-base">
                  Minimum{' '}
                  <span className="font-bold">
                    ${minimum_investment?.toLocaleString()}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-700">
                <ShieldCheckIcon className="h-5 w-5 text-slate-500" />
                <span className="text-base">
                  Privacy <span className="font-bold">100% guaranteed</span>
                </span>
              </div>

              <div className="flex items-center gap-4 text-slate-700">
                <CalendarIcon className="h-5 w-5 text-slate-500" />
                <span className="text-base">
                  Duration{' '}
                  <span className="font-bold">
                    {duration_months || 6} Months
                  </span>
                </span>
              </div>
            </div>

            {/* "ANALYSIS" SECTION (Dynamic Analysis List) */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex gap-4">
                <AcademicCapIcon className="h-6 w-6 text-slate-400" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">
                    Analysis Breakdown:
                  </h4>
                  <TextExpander children={analysis} initialLines={3} />
                 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
