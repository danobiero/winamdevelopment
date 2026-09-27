import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-3.5 sm:px-6 py-8 sm:py-14">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 md:p-10 text-center space-y-6 sm:space-y-8 border border-slate-100">
        {/* Success Icon */}
        <div className="mx-auto w-14 h-14 sm:w-18 sm:h-18 bg-green-100/80 rounded-full flex items-center justify-center animate-bounce-short">
          <svg
            className="w-7 h-7 sm:w-9 sm:h-9 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Request <span className="text-blue-600">Sent Successfully</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Thanks for reaching out to the{' '}
            <span className="font-semibold text-blue-950">WINAM</span> team.
            We've received your request and will get back to you shortly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-2 sm:pt-4">
          <Link
            href="/opportunities"
            className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-950 text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-blue-900 transition-all active:scale-95 shadow-md text-center"
          >
            View opportunities
          </Link>

          <Link
            href="/account/support"
            className="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-center"
          >
            View My Requests
          </Link>
        </div>

        {/* Subtle Footer */}
        <p className="text-[11px] sm:text-xs text-slate-400 italic">
          Typical response time: Under 24 hours.
        </p>
      </div>
    </div>
  );
}
