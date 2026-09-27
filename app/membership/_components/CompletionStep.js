import { RocketLaunchIcon, SparklesIcon, CheckBadgeIcon, ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function CompletionStep({ session }) {
  return (
    <div className="max-w-3xl mx-auto my-6 sm:my-12 md:my-16 px-4">
      <div className="relative bg-gradient-to-b from-emerald-500/10 via-white to-slate-50 border border-emerald-200/80 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 md:p-12 text-center shadow-2xl overflow-hidden backdrop-blur-sm">
        
        {/* Subtle Background Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Step Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100/80 border border-emerald-200 rounded-full text-xs font-black text-emerald-800 uppercase tracking-widest mb-6 sm:mb-8 shadow-sm">
          <CheckBadgeIcon className="h-4 w-4 text-emerald-600" />
          <span>Step 7 of 7 — Completed</span>
        </div>

        {/* Hero Icon with Pulsing Ring */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-100">
          <RocketLaunchIcon className="h-10 w-10 sm:h-12 sm:w-12 text-white animate-bounce-short" />
        </div>

        {/* Header Text */}
        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight mb-3 sm:mb-4">
          Welcome to the <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">Winam Ecosystem</span>
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-8 sm:mb-10 font-medium">
          Congratulations, <span className="font-bold text-slate-900">{session?.user?.name || 'Shareholder'}</span>! You have successfully completed your minimum shareholding requirement and unlocked full shareholder access across the Winam ecosystem.
        </p>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10 text-left">
          <div className="bg-white/80 border border-emerald-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shareholding</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">$2,000 Core Met</p>
            </div>
          </div>

          <div className="bg-white/80 border border-emerald-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <ChartBarIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venture Access</p>
              <p className="text-xs font-bold text-slate-900 mt-0.5">Selective Deals</p>
            </div>
          </div>

          <div className="bg-white/80 border border-emerald-100 p-4 rounded-2xl shadow-sm flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
              <p className="text-xs font-bold text-emerald-700 mt-0.5">Full Member</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link
            href="/account/investments"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl text-base sm:text-lg font-bold transition-all shadow-xl shadow-emerald-600/25 active:scale-95"
          >
            <span>Start Investing</span>
            <RocketLaunchIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/account/documents"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-4 rounded-2xl text-base sm:text-lg font-bold transition-all active:scale-95"
          >
            View Documents
          </Link>
        </div>

      </div>
    </div>
  );
}
