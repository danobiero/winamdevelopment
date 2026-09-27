import { BellAlertIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

export const dynamic = 'force-dynamic';

export default function DecisionStep({
  session,
  membershipRecord,
  onAcknowledge,
  isWorking,
}) {
  
  const isApproved = membershipRecord?.status === 'approved';

  return (
    <div className="max-w-2xl mx-auto mt-20 p-12 bg-white border border-slate-200 rounded-3xl text-center shadow-xl">
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isApproved ? 'bg-emerald-50' : 'bg-red-50'
        }`}
      >
        {isApproved ? (
          <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
        ) : (
          <BellAlertIcon className="h-10 w-10 text-red-600" />
        )}
      </div>

      <h2 className="text-3xl font-black text-primary-950 mb-4">
        {isApproved ? 'Application Approved' : 'Application Decision'}
      </h2>

      <div className="text-slate-600 leading-relaxed mb-6 space-y-4">
        <p>
          {isApproved
            ? `Congratulations ${session?.user?.name}, your application has been approved.`
            : `Thank you ${session?.user?.name}. Unfortunately, your application was not approved at this time.`}
        </p>

        {/* BONUS: Show the applicant exactly why they were rejected based on admin notes */}
        {!isApproved && membershipRecord?.decision_result && (
          <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl text-sm font-medium text-red-800 text-left">
            <span className="font-bold uppercase tracking-widest text-[10px] block mb-1 text-red-500">
              Decision Notes
            </span>
            {membershipRecord.decision_result}
          </div>
        )}
      </div>

      {/* FIX 2: Ensure onAcknowledge fires for both scenarios so the DB updates */}
      <button
        onClick={onAcknowledge}
        disabled={isWorking}
        className={`${
          isApproved
            ? 'bg-primary-600 hover:bg-primary-700'
            : 'bg-slate-900 hover:bg-black'
        } disabled:bg-slate-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md`}
      >
        {isWorking
          ? 'Please wait...'
          : isApproved
            ? 'Continue to Agreement'
            : 'Acknowledge Decision'}
      </button>

      {/* Optional: Give them a way to sign out if rejected */}
      {!isApproved && (
        <div className="mt-6">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}

      <div className="mt-8 block px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-500 uppercase tracking-widest w-fit mx-auto">
        Step 4 of 7
      </div>
    </div>
  );
}
