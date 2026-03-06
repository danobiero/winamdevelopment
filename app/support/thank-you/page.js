import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-8 border border-gray-100">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-short">
          <svg
            className="w-10 h-10 text-green-600"
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

        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Sent Successfully!
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Thanks for reaching out to the{' '}
            <span className="font-semibold text-blue-950">PRAXIDA</span> team.
            We've received your request and will get back to you shortly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Link
            href="/lessons"
            className="flex-1 px-6 py-3 bg-blue-950 text-white font-medium rounded-lg hover:bg-opacity-90 transition-all active:scale-95 shadow-md"
          >
            Continue Lessons
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all active:scale-95"
          >
            Back Home
          </Link>
        </div>

        {/* Subtle Footer */}
        <p className="text-xs text-gray-400 italic">
          Typical response time: Under 24 hours.
        </p>
      </div>
    </div>
  );
}
