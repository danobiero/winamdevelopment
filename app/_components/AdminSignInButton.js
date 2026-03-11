'use client';

import { useState } from 'react';
import { adminSignInAction } from '../_lib/actions';
import AdminGate from '../admin-login/AdminGate';

export default function AdminSignInButton() {
  const [step, setStep] = useState('entry'); // 'entry', 'gate', 'verified'

  // STEP 1: INITIAL "INSTRUCTORS" BUTTON
  if (step === 'entry') {
    return (
      <button
        onClick={() => setStep('gate')}
        className="flex items-center justify-center gap-4 text-sm md:text-base border-2 border-[#000033] bg-[#000033] text-white px-4 py-4 font-black uppercase tracking-[0.2em] w-full transition-all hover:bg-blue-700 hover:border-blue-700 active:scale-[0.98] rounded-xl shadow-lg shadow-blue-900/20"
      >
        <span className="truncate">Instructors</span>
      </button>
    );
  }

  // STEP 2: THE VERIFICATION GATE
  if (step === 'gate') {
    return (
      <div className="w-full animate-in fade-in zoom-in-95 duration-300">
        <AdminGate onVerified={() => setStep('verified')} />
        <button
          onClick={() => setStep('entry')}
          className="mt-4 w-full text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Cancel
        </button>
      </div>
    );
  }

  // STEP 3: FINAL GOOGLE SIGN IN (REVEALED AFTER VERIFICATION)
  return (
    <form
      action={adminSignInAction}
      className="w-full animate-in slide-in-from-top-2 duration-500"
    >
      <button className="flex items-center justify-center gap-4 text-base border-2 border-emerald-500 bg-emerald-50 text-emerald-700 px-4 py-4 font-black uppercase tracking-tight w-full transition-all hover:bg-emerald-100 active:scale-[0.98] rounded-xl">
        <img
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          height="20"
          width="20"
          className="shrink-0"
        />
        <span className="truncate">Confirm Google Admin Access</span>
      </button>
    </form>
  );
}
