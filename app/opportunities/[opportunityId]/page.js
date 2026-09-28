export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/app/_lib/auth';
import {
  getOpportunityById,
  getMemberStatusByEmail,
} from '@/app/_lib/data-service';
import { getPaymentMode } from '@/app/_lib/actions';
import InvestAction from '@/app/_components/InvestAction';
import TextExpander from '@/app/_components/TextExpander';
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  AcademicCapIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

////////////////////////////////////////////////////////////
// BUSINESS RULE
////////////////////////////////////////////////////////////
function canInvest(memberData, opportunity) {
  if (!memberData) return false;
  if (memberData.status !== 'completed') return false;
  if (opportunity.type === 'core') return false;
  return true;
}

const statusStyles = {
  active: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200',
  funded: 'bg-sky-600 text-white shadow-sm shadow-sky-200',
  closed: 'bg-slate-700 text-white',
  inactive: 'bg-slate-300 text-slate-700',
};

////////////////////////////////////////////////////////////
// PAGE
////////////////////////////////////////////////////////////
export default async function Page({ params }) {
  const id = params?.opportunityId;

  ////////////////////////////////////////////////////////////
  // GUARD
  ////////////////////////////////////////////////////////////
  if (!id || id === 'undefined') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-bold mb-4">Invalid opportunity requested.</p>
        <Link
          href="/opportunities"
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Opportunities
        </Link>
      </div>
    );
  }

  ////////////////////////////////////////////////////////////
  // FETCH OPPORTUNITY & PAYMENT MODE
  ////////////////////////////////////////////////////////////
  const [opportunity, paymentMode] = await Promise.all([
    getOpportunityById(id),
    getPaymentMode(),
  ]);

  if (!opportunity) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-bold mb-4">No opportunity available.</p>
        <Link
          href="/opportunities"
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Opportunities
        </Link>
      </div>
    );
  }

  const {
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

  ////////////////////////////////////////////////////////////
  // AUTH
  ////////////////////////////////////////////////////////////
  const session = await auth();

  ////////////////////////////////////////////////////////////
  // MEMBER DATA
  ////////////////////////////////////////////////////////////
  let memberData = null;
  if (session?.user?.email) {
    memberData = await getMemberStatusByEmail(session.user.email);
  }

  ////////////////////////////////////////////////////////////
  // DERIVED STATE
  ////////////////////////////////////////////////////////////
  const isCompleted = memberData?.status === 'completed';
  const isCore = type === 'core';
  const canUserInvest = canInvest(memberData, opportunity);
  const typeLabel = type?.replace('_', ' ') || 'Investment';
  const safeImage =
    image_url && image_url.startsWith('http') ? image_url.trim() : '/logo.png';

  ////////////////////////////////////////////////////////////
  // UI - FIT TO SCREEN & RESPONSIVE LAYOUT
  ////////////////////////////////////////////////////////////
  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 xl:py-4 flex-1 flex flex-col justify-between lg:h-full lg:max-h-full lg:overflow-hidden min-h-0">
      {/* 🔹 TOP NAVIGATION & STATUS HEADER */}
      <header className="w-full flex items-center justify-between gap-3 pb-2.5 sm:pb-3 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all shadow-2xs shrink-0"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to Opportunities</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base xl:text-lg font-black text-slate-900 tracking-tight truncate">
              Opportunity <span className="text-blue-600">Details</span> <span className="text-slate-300 font-normal">|</span> {name}
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
              {typeLabel} Opportunity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {is_featured && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-black shadow-2xs">
              <StarIcon className="h-3 w-3" />
              Featured
            </span>
          )}
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-2xs ${
              statusStyles[status] || statusStyles.inactive
            }`}
          >
            {status}
          </span>
        </div>
      </header>

      {/* 🔹 MAIN SPLIT VIEW (2 COLUMNS ON DESKTOP, FLUID SCROLL ON MOBILE) */}
      <div className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 xl:gap-5 py-2.5 sm:py-3 lg:overflow-hidden">
        {/* LEFT COLUMN: HERO IMAGE & CORE METRICS (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col min-h-0 gap-3 xl:gap-3.5 lg:h-full lg:overflow-hidden justify-between">
          {/* Visual Hero Card */}
          <div className="relative w-full flex-1 min-h-[220px] sm:min-h-[280px] lg:min-h-0 rounded-2xl xl:rounded-3xl overflow-hidden bg-slate-900 shadow-sm border border-slate-200/80 shrink-0 lg:shrink">
            <Image
              src={safeImage}
              fill
              alt={name}
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

            {/* Badges on Hero */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/95 text-slate-900 text-xs font-black uppercase tracking-wider shadow-sm backdrop-blur-sm">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-600" />
                {typeLabel}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900/80 text-white text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm">
                Winam Ecosystem
              </span>
            </div>
          </div>

          {/* Quick Metrics Matrix (2x2) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
            <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <CurrencyDollarIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Min. Investment
                </span>
              </div>
              <p className="text-sm sm:text-base xl:text-lg font-black text-slate-900 truncate">
                ${minimum_investment ? Number(minimum_investment).toLocaleString() : '0'}
              </p>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Target Return
                </span>
              </div>
              <p className="text-sm sm:text-base xl:text-lg font-black text-blue-600 truncate">
                +{expected_return}%
              </p>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <ClockIcon className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Duration
                </span>
              </div>
              <p className="text-sm sm:text-base xl:text-lg font-black text-slate-900 truncate">
                {duration_months ? `${duration_months} Months` : 'Flexible'}
              </p>
            </div>

            <div className="bg-white p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Security
                </span>
              </div>
              <p className="text-sm sm:text-base xl:text-lg font-black text-slate-900 truncate">
                100% Protected
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EXECUTIVE BRIEFING & ACTION CONSOLE (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 xl:p-7 shadow-xs lg:h-full lg:overflow-y-auto custom-scrollbar justify-between gap-4">
          <div className="space-y-4">
            {/* Title & Category Banner */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider mb-1.5">
                Strategic Opportunity
              </div>
              <h2 className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {name}
              </h2>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Executive Overview
              </h3>
              <p className="text-xs sm:text-sm xl:text-base text-slate-600 leading-relaxed font-normal">
                {description ||
                  'Comprehensive market analysis and growth strategy for this strategic investment asset within the WINAM ecosystem.'}
              </p>
            </div>

            {/* Analysis & Highlights */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 mb-2">
                <AcademicCapIcon className="h-4 w-4 text-blue-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold tracking-tight">
                  Analysis & Investment Breakdown
                </h3>
              </div>
              <TextExpander initialLines={4}>
                {analysis}
              </TextExpander>
            </div>
          </div>

          {/* Integrated Action Console (Pinned to bottom on desktop) */}
          <div className="pt-3 sm:pt-4 border-t border-slate-100">
            {!session?.user ? (
              /* Case 1: NOT LOGGED IN */
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Sign in to participate</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access membership shareholding allocations and investment features.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <Link
                    href="/login"
                    className="flex-1 sm:flex-initial text-center px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-2xs"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/membership"
                    className="flex-1 sm:flex-initial text-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    Become a Member
                  </Link>
                </div>
              </div>
            ) : isCompleted && isCore ? (
              /* Case 2: COMPLETED BUT CORE (BLOCKED) */
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start gap-3">
                <LockClosedIcon className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800">Core Investment Allocation Reached</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Core opportunities are reserved for initial shareholding allocation and are no longer available once your membership is completed and core is met.
                  </p>
                </div>
              </div>
            ) : !isCompleted ? (
              /* Case 3: NOT COMPLETED (STEP 7 LOCKED) */
              <div className="bg-amber-50/80 border border-amber-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <LockClosedIcon className="h-4 w-4 text-amber-600" />
                    <span>Membership Step 7 Required</span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-1 max-w-lg leading-relaxed">
                    To invest in selective ventures like {name}, you must complete your minimum core shareholding of $2,000.
                    {memberData && (
                      <span className="font-mono font-bold block sm:inline sm:ml-2">
                        (${memberData.current_shareholding_value || 0} / $2,000)
                      </span>
                    )}
                  </p>
                </div>
                <Link href="/membership" className="shrink-0">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-5 py-2.5 bg-primary-950 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Complete Shareholding
                  </button>
                </Link>
              </div>
            ) : status === 'active' && canUserInvest ? (
              /* Case 4: ELIGIBLE & ACTIVE */
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">
                    Ready to invest in {name}?
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Immediate allocation • Minimum ${minimum_investment ? Number(minimum_investment).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="w-full sm:w-auto shrink-0">
                  <InvestAction
                    opportunity={opportunity}
                    paymentMode={paymentMode}
                    user={{
                      name: session?.user?.name || memberData?.fullName || '',
                      email: session?.user?.email || '',
                      shareholderId: session?.user?.shareholderId || memberData?.id,
                    }}
                    className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* Case 5: INACTIVE */
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                This opportunity is currently {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
