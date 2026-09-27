'use client';

import { createMembershipApplication } from '@/app/_lib/actions';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="w-full mt-10 bg-primary-950 text-white py-4 rounded-xl text-xl font-bold hover:bg-primary-800 transition-all shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {pending
        ? 'Submitting Application...'
        : 'Submit Application & Proceed to Step 2'}
    </button>
  );
}

export default function MembershipForm({ session }) {
  return (
    <form
      action={createMembershipApplication}
      className="bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 md:p-12 max-w-4xl mx-auto mb-20"
    >
      <div className="space-y-8 text-left">
        {/* SECTION 1: PERSONAL INFO */}
        <div>
          <h2 className="text-2xl font-bold text-primary-950 mb-6 border-b border-slate-100 pb-2">
            1. Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-slate-700">Full Name</label>
              <input
                required
                name="fullName"
                type="text"
                defaultValue={session?.user?.name}
                className="px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-slate-700">
                Email Address
              </label>
              <input
                required
                name="email"
                type="email"
                defaultValue={session?.user?.email}
                readOnly
                className="px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
              />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="font-semibold text-slate-700">
                Telephone Number
              </label>
              <input
                required
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="px-4 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: INVESTMENT PROFILE */}
        <div>
          <h2 className="text-2xl font-bold text-primary-950 mb-6 border-b border-slate-100 pb-2">
            2. Investment Profile
          </h2>
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-slate-700">
                Primary Investment Interest
              </label>
              <select
                name="interest"
                className="px-4 py-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="Real Estate">Real Estate</option>
                <option value="Stock Market">Stock Market</option>
                <option value="Venture Capital / Startups">
                  Venture Capital / Startups
                </option>
                <option value="Mixed Portfolio">Mixed Portfolio</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-slate-700">Experience</label>
              <textarea
                name="experience"
                rows="3"
                placeholder="Briefly describe your investment background..."
                className="px-4 py-3 rounded-xl border border-slate-300 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 3: LEGAL */}
        <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100">
          <h2 className="text-xl font-bold text-primary-900 mb-4">
            3. Membership Commitment
          </h2>
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                required
                name="agreeShareholding"
                type="checkbox"
                className="mt-1 h-5 w-5 rounded text-primary-600"
              />
              <span className="text-slate-700 text-sm">
                I understand the minimum shareholding of <strong>$2,000</strong>{' '}
                must be completed within 12 months.
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                required
                name="agreeOA"
                type="checkbox"
                className="mt-1 h-5 w-5 rounded text-primary-600"
              />
              <span className="text-slate-700 text-sm">
                I agree to sign the{' '}
                <strong>Winam Development Group, LLC Operating Agreement</strong> upon approval.
              </span>
            </label>
          </div>
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
