'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { submitSupportAction } from '../_lib/actions';
import { formatClientError } from '@/app/_lib/client-error-handler';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function SupportForm({ session }) {
  const isLoggedIn = !!session?.user;
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    try {
      await submitSupportAction(formData);
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error(
        formatClientError(error, 'Unable to submit your support request. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyles =
    'w-full px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/60 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all font-medium';

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-5 lg:p-6 min-h-0 lg:overflow-hidden">
      <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-7 md:p-8 my-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 text-blue-600 mb-2 sm:mb-3 shadow-xs border border-blue-100/60">
            <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-1">
            Customer <span className="text-blue-600">Support</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {isLoggedIn ? (
              <>
                Logged in as{' '}
                <span className="font-semibold text-slate-800">
                  {session.user.name || session.user.email}
                </span>
                . How can we assist you?
              </>
            ) : (
              "Drop us a message and our team will get back to you shortly."
            )}
          </p>
        </div>

        {/* Support Form */}
        <form action={handleSubmit} className="space-y-3.5 sm:space-y-4">
          {!isLoggedIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 ml-0.5">
                  Name
                </label>
                <input
                  name="name"
                  placeholder="Jane Doe"
                  required
                  className={inputStyles}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 ml-0.5">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  required
                  className={inputStyles}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 ml-0.5">
              Subject
            </label>
            <input
              name="subject"
              placeholder="How can we help?"
              required
              className={inputStyles}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 ml-0.5">
              Message
            </label>
            <textarea
              name="message"
              rows={3}
              placeholder="Please describe your inquiry or issue in detail..."
              required
              className={`${inputStyles} min-h-[85px] sm:min-h-[110px] resize-none`}
            />
          </div>

          <div className="pt-1.5 sm:pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-950 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 rounded-xl shadow-md hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>

        <p className="mt-3.5 sm:mt-4 text-center text-slate-400 text-xs">
          By submitting, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  );
}
