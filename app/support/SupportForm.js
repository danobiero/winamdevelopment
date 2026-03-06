'use client';

import { useState } from 'react';
import { submitSupportAction } from '../_lib/actions';

export default function SupportForm({ session }) {
  const isLoggedIn = !!session?.user;
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    try {
      await submitSupportAction(formData);
    } catch (error) {
      console.error('Submission failed', error);
    } finally {
      setLoading(false);
    }
  }

  const inputStyles =
    'w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 focus:bg-white';

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Customer Support Form
          </h2>
          <p className="text-gray-500">
            {isLoggedIn
              ? `Logged in as ${session.user.name}. How can we help?`
              : "Drop us a message and we'll get back to you shortly."}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-5">
          {!isLoggedIn && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">
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
                <label className="text-sm font-medium text-gray-700 ml-1">
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
            <label className="text-sm font-medium text-gray-700 ml-1">
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
            <label className="text-sm font-medium text-gray-700 ml-1">
              Message
            </label>
            <textarea
              name="message"
              rows={5}
              placeholder="Please describe your issue in detail..."
              required
              className={`${inputStyles} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-950 text-white font-semibold py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                Processing...
              </>
            ) : (
              'Send Message'
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-center text-gray-400 text-sm">
        By submitting, you agree to our terms of service.
      </p>
    </div>
  );
}
