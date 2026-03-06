'use client';

import { useFormStatus } from 'react-dom';
import { createSupportTicket } from '../../_lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="relative flex h-12 w-full items-center justify-center overflow-hidden rounded-lg bg-primary-600 font-semibold text-white transition-all hover:bg-primary-700 active:scale-95 disabled:bg-slate-300 sm:w-48"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-5 w-5 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing...
        </span>
      ) : (
        'Submit Ticket'
      )}
    </button>
  );
}

export default function SupportForm() {
  return (
    <form
      action={createSupportTicket}
      className="mx-auto w-full max-w-2xl space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-10"
    >
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Subject */}
        <div className="group relative">
          <label
            htmlFor="subject"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-primary-600"
          >
            What's the issue?
          </label>
          <input
            required
            name="subject"
            id="subject"
            placeholder="Help with my course"
            className="w-full border-b-2 border-slate-200 bg-transparent py-2 text-lg font-medium outline-none transition-all focus:border-primary-500 placeholder:text-slate-300"
          />
        </div>

        {/* Priority */}
        <div className="group relative">
          <label
            htmlFor="priority"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-primary-600"
          >
            Priority Level
          </label>
          <select
            name="priority"
            id="priority"
            defaultValue="normal"
            className="w-full cursor-pointer border-b-2 border-slate-200 bg-transparent py-2 text-lg font-medium outline-none transition-all focus:border-primary-500"
          >
            <option value="low">Low (Question)</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent (Blocked)</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div className="group relative">
        <label
          htmlFor="message"
          className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-primary-600"
        >
          Message Details
        </label>
        <textarea
          required
          name="message"
          id="message"
          rows={4}
          placeholder="Tell us more about what you need help with..."
          className="w-full resize-none rounded-xl border border-slate-200 p-4 text-slate-700 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
        ></textarea>
      </div>

      <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
        <p className="text-center text-sm text-slate-400 sm:text-left">
          We usually respond within{' '}
          <span className="font-bold text-slate-600">24 hours</span>.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
