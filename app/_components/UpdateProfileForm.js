'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { updateProfile } from '../_lib/actions';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  IdentificationIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <SparklesIcon className="h-3.5 w-3.5 text-blue-200" />
          <span>Save Profile</span>
        </>
      )}
    </button>
  );
}

function UpdateProfileForm({ user, children }) {
  const {
    fullName = '',
    email = '',
    telephone = '',
    nationality = '',
    id = '',
  } = user || {};

  const [state, formAction] = useFormState(updateProfile, null);
  const [telValue, setTelValue] = useState(telephone || '');

  // Calculate initials for avatar
  const initials = (fullName || 'Shareholder')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Validate phone live (9-12 digits)
  const isPhoneValid = /^[0-9]{9,12}$/.test(telValue.trim());

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col">
      <form action={formAction} className="flex-1 min-h-0 flex flex-col">
        {/* 2-COLUMN LAYOUT TO FIT LARGE SCREENS WITHOUT VERTICAL SCROLL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
          {/* LEFT COLUMN: IDENTITY & COMPLIANCE (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-3 min-h-0">
            {/* PROFILE IDENTITY CARD */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-br from-[#000033] via-slate-900 to-blue-950 rounded-2xl text-white shadow-xs border border-slate-800 flex items-center gap-3 shrink-0">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-base font-black shadow-inner shrink-0 ring-2 ring-white/10">
                {initials || <UserIcon className="h-5 w-5 text-white" />}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-black tracking-tight truncate">
                    {fullName || 'Shareholder'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheckIcon className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 truncate">{email}</p>

                <div className="flex items-center gap-2 pt-0.5 text-[10px] font-medium text-slate-400">
                  {id && (
                    <span className="flex items-center gap-1 font-mono">
                      <IdentificationIcon className="h-3 w-3 text-blue-400" />
                      #{id}
                    </span>
                  )}
                  {id && nationality && <span>•</span>}
                  {nationality && (
                    <span className="truncate max-w-[130px] text-slate-300">
                      {nationality}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* COMPLIANCE & SECURITY INFORMATION */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex-1 flex flex-col justify-between min-h-0">
              <div>
                <div className="pb-2 border-b border-slate-100 mb-2 flex items-center justify-between shrink-0">
                  <h3 className="text-xs font-black text-[#000033] uppercase tracking-wider">
                    Portfolio Compliance
                  </h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckBadgeIcon className="h-3 w-3 text-emerald-600" />
                    Active KYC
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Your identity and accredited investor credentials are authenticated. Personal details are securely recorded with portfolio compliance partners for issuance of formal certificates and distribution schedules.
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-start gap-2 text-[10px] text-slate-500 shrink-0">
                <InformationCircleIcon className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-tight font-medium">
                  Primary email is linked to Google authentication. To update legal name, nationality, or telephone, edit and save.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PROFILE FORM FIELDS (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col min-h-0">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3.5 sm:p-5 flex-1 flex flex-col justify-between min-h-0">
              <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                <div className="pb-2 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-xs font-black text-[#000033] uppercase tracking-wider">
                      Edit Shareholder Information
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Official credentials associated with your investment holdings
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Credentials
                  </span>
                </div>

                {/* 2x2 GRID OF INPUTS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label
                      htmlFor="fullName"
                      className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                      <span>Full Name</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      defaultValue={fullName}
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Country / Nationality (children) */}
                  <div className="space-y-1">{children}</div>

                  {/* Email Address (Locked) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor="email"
                        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"
                      >
                        <EnvelopeIcon className="h-3.5 w-3.5 text-blue-600" />
                        <span>Email Address</span>
                      </label>
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                        <LockClosedIcon className="h-2.5 w-2.5" />
                        Locked
                      </span>
                    </div>
                    <input
                      id="email"
                      disabled
                      defaultValue={email}
                      className="w-full px-3.5 py-2 sm:py-2.5 bg-slate-100 border border-slate-200 text-slate-500 font-medium text-xs sm:text-sm rounded-xl cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Telephone */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor="telephone"
                        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"
                      >
                        <PhoneIcon className="h-3.5 w-3.5 text-blue-600" />
                        <span>Phone Number</span>
                      </label>
                      {telValue && (
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded transition-colors ${
                            isPhoneValid
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                              : 'text-amber-700 bg-amber-50 border border-amber-200'
                          }`}
                        >
                          {isPhoneValid ? 'Valid' : `${telValue.trim().length} digits`}
                        </span>
                      )}
                    </div>
                    <input
                      id="telephone"
                      name="telephone"
                      value={telValue}
                      onChange={(e) => setTelValue(e.target.value)}
                      placeholder="e.g. 1234567890"
                      required
                      className={`w-full px-3.5 py-2 sm:py-2.5 bg-slate-50/70 border text-slate-900 font-medium text-xs sm:text-sm rounded-xl outline-none transition-all placeholder:text-slate-400 ${
                        telValue && !isPhoneValid
                          ? 'border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10'
                          : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10'
                      }`}
                    />
                  </div>
                </div>

                {/* FEEDBACK STATUS ALERTS */}
                {state?.success && (
                  <div className="flex items-start gap-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl animate-in fade-in duration-200">
                    <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">Profile Saved</p>
                      <p className="text-[11px] text-emerald-700">
                        {state.message || 'Your investor profile has been updated.'}
                      </p>
                    </div>
                  </div>
                )}

                {state?.error && (
                  <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl animate-in fade-in duration-200">
                    <ExclamationCircleIcon className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">Update Failed</p>
                      <p className="text-[11px] text-rose-700">
                        {state.message || 'Unable to update profile. Please verify your entries.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION BAR */}
              <div className="pt-2.5 mt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                  Saved changes synchronize automatically with portfolio compliance records.
                </p>
                <SubmitButton />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default UpdateProfileForm;
