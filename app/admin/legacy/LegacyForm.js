'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createLegacyShareholder } from '@/app/_lib/actions';
import { FormatCurrency } from '@/app/_lib/utils';

function formatWithCommas(value) {
  if (!value && value !== 0) return '';
  const str = String(value);
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Registering Legacy Shareholder...</span>
        </>
      ) : (
        <>
          <SparklesIcon className="h-4 w-4 text-blue-200" />
          <span>Save to Legacy Staging</span>
        </>
      )}
    </button>
  );
}

export default function LegacyForm({ opportunities = [] }) {
  const [state, formAction] = useFormState(createLegacyShareholder, null);
  const [paymentType, setPaymentType] = useState('none');
  const formRef = useRef(null);

  const [allocations, setAllocations] = useState([
    {
      id: 'alloc-1',
      opportunityId: '',
      amountInvested: '',
      startDate: new Date().toISOString().split('T')[0],
    },
  ]);

  // Reset form upon successful submission
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setAllocations([
        {
          id: `alloc-${Date.now()}`,
          opportunityId: '',
          amountInvested: '',
          startDate: new Date().toISOString().split('T')[0],
        },
      ]);
      setPaymentType('none');
    }
  }, [state]);

  const handleAddAllocation = () => {
    setAllocations((prev) => [
      ...prev,
      {
        id: `alloc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        opportunityId: '',
        amountInvested: '',
        startDate: new Date().toISOString().split('T')[0],
      },
    ]);
  };

  const handleRemoveAllocation = (id) => {
    setAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleUpdateAllocation = (id, field, value) => {
    setAllocations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const totalInvested = allocations.reduce(
    (sum, item) => sum + (Number(item.amountInvested) || 0),
    0
  );

  const validAllocations = allocations.filter(
    (item) => item.opportunityId && String(item.opportunityId).trim() !== ''
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm border-b-4 border-b-slate-100 p-5 sm:p-8 space-y-8 w-full min-w-0"
    >
      {/* SECTION 1: SHAREHOLDER IDENTITY */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#000033] uppercase tracking-wider">
              1. Shareholder Identity
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Personal & contact credentials to match on Google sign-in
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
            Required For Match
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="fullName"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              <UserIcon className="h-4 w-4 text-blue-600" />
              <span>Full Name</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              placeholder="e.g. Jane Investor"
              className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              <EnvelopeIcon className="h-4 w-4 text-blue-600" />
              <span>Email Address (Google Login)</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="e.g. investor@gmail.com"
              className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 font-medium">
              The exact email the investor will use to sign in via Google.
            </p>
          </div>

          {/* Telephone */}
          <div className="space-y-1.5">
            <label
              htmlFor="telephone"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              <PhoneIcon className="h-4 w-4 text-blue-600" />
              <span>Phone Number (Optional)</span>
            </label>
            <input
              id="telephone"
              name="telephone"
              placeholder="e.g. 5551234567"
              className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Nationality */}
          <div className="space-y-1.5">
            <label
              htmlFor="nationality"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              <GlobeAltIcon className="h-4 w-4 text-blue-600" />
              <span>Nationality (Optional)</span>
            </label>
            <input
              id="nationality"
              name="nationality"
              placeholder="e.g. United States of America"
              className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: PORTFOLIO & COMMITMENT */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#000033] uppercase tracking-wider">
              2. Portfolio & Investment Holdings
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Historical allocation(s) to transfer into live investments. One legacy shareholder can hold multiple opportunities.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Direct Credit
          </span>
        </div>

        {/* Hidden inputs to pass data to Server Action */}
        <input
          type="hidden"
          name="allocations"
          value={JSON.stringify(validAllocations)}
        />
        <input
          type="hidden"
          name="opportunityId"
          value={validAllocations[0]?.opportunityId || ''}
        />
        <input
          type="hidden"
          name="amountInvested"
          value={totalInvested}
        />
        <input
          type="hidden"
          name="startDate"
          value={validAllocations[0]?.startDate || new Date().toISOString().split('T')[0]}
        />

        {/* ALLOCATIONS LIST */}
        <div className="space-y-3">
          {allocations.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center space-y-2.5">
              <p className="text-xs font-semibold text-slate-500">
                No investment opportunities currently allocated (Membership Only).
              </p>
              <button
                type="button"
                onClick={handleAddAllocation}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add Allocated Opportunity</span>
              </button>
            </div>
          ) : (
            allocations.map((item, index) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3 relative group transition-all"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Allocated Opportunity #{index + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAllocation(item.id)}
                    title="Remove this allocated opportunity"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Opportunity Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                      <span>Allocated Opportunity</span>
                      <span className="text-[10px] text-slate-400 font-normal">Required</span>
                    </label>
                    <select
                      value={item.opportunityId}
                      onChange={(e) => handleUpdateAllocation(item.id, 'opportunityId', e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl shadow-2xs hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                    >
                      <option value="">Select Opportunity...</option>
                      {(opportunities || []).map((opp) => (
                        <option key={opp.id} value={opp.id}>
                          {opp.name} ({opp.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Invested Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <BanknotesIcon className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Invested Amount ($)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                        $
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="50,000"
                        value={formatWithCommas(item.amountInvested)}
                        onChange={(e) => {
                          let raw = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = raw.split('.');
                          if (parts.length > 2) return;
                          handleUpdateAllocation(item.id, 'amountInvested', raw);
                        }}
                        className="w-full pl-8 pr-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl shadow-2xs hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                      <CalendarDaysIcon className="h-3.5 w-3.5 text-blue-600" />
                      <span>Investment Start Date</span>
                    </label>
                    <input
                      type="date"
                      value={item.startDate}
                      onChange={(e) => handleUpdateAllocation(item.id, 'startDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl shadow-2xs hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* BOTTOM ACTION & SUMMARY BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleAddAllocation}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-blue-200 cursor-pointer w-full sm:w-auto justify-center"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Add Another Opportunity</span>
          </button>

          {allocations.length > 0 && (
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="font-semibold">Allocated:</span>
                <span className="font-bold text-slate-800">
                  {validAllocations.length} {validAllocations.length === 1 ? 'Opportunity' : 'Opportunities'}
                </span>
              </div>
              <div className="h-3.5 w-px bg-slate-300" />
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="font-semibold">Total:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  {FormatCurrency(totalInvested)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PAYOUT PREFERENCE */}
      <div className="space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#000033] uppercase tracking-wider">
              3. Payout Destination Preference (Optional)
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Pre-populate payout rail if already on company records
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Payment Type */}
          <div className="space-y-1.5">
            <label
              htmlFor="paymentType"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
            >
              <CreditCardIcon className="h-4 w-4 text-blue-600" />
              <span>Payout Rail</span>
            </label>
            <select
              id="paymentType"
              name="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all"
            >
              <option value="none">None (Shareholder Will Set)</option>
              <option value="zelle">Zelle</option>
              <option value="cashapp">CashApp</option>
              <option value="check">Check</option>
            </select>
          </div>

          {/* Account Handle / Details */}
          {paymentType !== 'none' && (
            <>
              <div className="space-y-1.5">
                <label
                  htmlFor="accountHandle"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  <span>Handle / Identifier</span>
                </label>
                <input
                  id="accountHandle"
                  name="accountHandle"
                  placeholder={
                    paymentType === 'zelle'
                      ? 'Email or phone'
                      : paymentType === 'cashapp'
                      ? '$Cashtag'
                      : 'Mailing Address'
                  }
                  className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="accountName"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  <span>Account Beneficiary Name</span>
                </label>
                <input
                  id="accountName"
                  name="accountName"
                  placeholder="Official name on account"
                  className="w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 4: ADMINISTRATIVE NOTES */}
      <div className="space-y-1.5">
        <label
          htmlFor="notes"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
        >
          <span>Internal Legacy Notes</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="e.g. Original physical agreement signed May 2021, Share certificate #104."
          className="w-full px-4 py-3 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-sm rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* FEEDBACK STATUS ALERTS */}
      {state?.success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold">Staging Record Saved</p>
            <p className="text-xs text-emerald-700 break-words">
              {state.message}
            </p>
          </div>
        </div>
      )}

      {state?.error && (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl">
          <ExclamationCircleIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold">Registration Failed</p>
            <p className="text-xs text-rose-700 break-words">
              {state.message}
            </p>
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-slate-400 text-center sm:text-left font-medium">
          Once saved, this data will automatically migrate to live tables when this email signs in for the first time.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}

