'use client';

import { useState, useEffect } from 'react';
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
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
    >
      {pending ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Saving Changes...</span>
        </>
      ) : (
        <>
          <SparklesIcon className="h-4 w-4 text-blue-200" />
          <span>Save Changes & Sync</span>
        </>
      )}
    </button>
  );
}

export default function EditLegacyModal({ record, opportunities = [], initialAllocations = [], onClose }) {
  const [state, formAction] = useFormState(createLegacyShareholder, null);
  const [paymentType, setPaymentType] = useState(record?.payment_type || 'none');

  // Initialize allocations from existing record
  const [allocations, setAllocations] = useState(() => {
    if (Array.isArray(initialAllocations) && initialAllocations.length > 0) {
      return initialAllocations.map((a, idx) => ({
        id: `alloc-${idx}-${Date.now()}`,
        opportunityId: String(a.opportunityId || ''),
        amountInvested: String(a.amount ?? ''),
        startDate: a.startDate || new Date().toISOString().split('T')[0],
      }));
    }
    return [
      {
        id: `alloc-1-${Date.now()}`,
        opportunityId: '',
        amountInvested: '',
        startDate: new Date().toISOString().split('T')[0],
      },
    ];
  });

  // Close modal on successful update after brief delay
  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state, onClose]);

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
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col border border-slate-100 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Manage Opportunities & Portfolio
              </h2>
              {record?.is_claimed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckBadgeIcon className="h-3 w-3 text-emerald-600" />
                  Live & Claimed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  <ClockIcon className="h-3 w-3 text-amber-500" />
                  Awaiting Sign-In
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
              {record?.full_name} ({record?.email})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {state && (
          <div
            className={`px-5 py-3 border-b text-xs flex items-center gap-2 shrink-0 ${
              state.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {state.success ? (
              <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <ExclamationCircleIcon className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{state.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form action={formAction} className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Hidden inputs to pass data */}
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

          {/* Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <input
                name="fullName"
                defaultValue={record?.full_name || ''}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address (Unique ID)
              </label>
              <input
                name="email"
                defaultValue={record?.email || ''}
                required
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs rounded-xl cursor-not-allowed outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Telephone (Optional)
              </label>
              <input
                name="telephone"
                defaultValue={record?.telephone || ''}
                placeholder="e.g. 5551234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nationality (Optional)
              </label>
              <input
                name="nationality"
                defaultValue={record?.nationality || ''}
                placeholder="e.g. USA"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:bg-white focus:border-blue-600 outline-none transition-all"
              />
            </div>
          </div>

          {/* ALLOCATED OPPORTUNITIES SECTION */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Allocated Investment Opportunities
                </h4>
                <p className="text-xs text-slate-400">
                  Add, adjust, or remove investment opportunities for this shareholder.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-black uppercase text-slate-400 block">Total Invested</span>
                <span className="text-sm font-mono font-bold text-emerald-600">
                  {FormatCurrency(totalInvested)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {allocations.map((alloc, index) => (
                <div
                  key={alloc.id}
                  className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Allocation #{index + 1}
                    </span>
                    {allocations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAllocation(alloc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remove allocation"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Opportunity Dropdown */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Opportunity
                      </label>
                      <select
                        value={alloc.opportunityId}
                        onChange={(e) =>
                          handleUpdateAllocation(alloc.id, 'opportunityId', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl focus:border-blue-600 outline-none"
                      >
                        <option value="">Select Opportunity...</option>
                        {(opportunities || []).map((opp) => (
                          <option key={opp.id} value={opp.id}>
                            {opp.name} ({opp.type || 'Standard'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Invested Amount ($)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs pointer-events-none">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="10,000"
                          value={formatWithCommas(alloc.amountInvested)}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = raw.split('.');
                            if (parts.length > 2) return;
                            handleUpdateAllocation(alloc.id, 'amountInvested', raw);
                          }}
                          className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 text-slate-900 font-mono text-xs font-semibold rounded-xl focus:border-blue-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={alloc.startDate}
                        onChange={(e) =>
                          handleUpdateAllocation(alloc.id, 'startDate', e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-900 font-mono text-xs rounded-xl focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Allocation Button */}
            <button
              type="button"
              onClick={handleAddAllocation}
              className="w-full py-2.5 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="h-4 w-4 text-blue-600" />
              <span>Add Another Opportunity</span>
            </button>
          </div>

          {/* Payout Rail & Notes */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Payout & Administrative Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Payout Rail
                </label>
                <select
                  name="paymentType"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                >
                  <option value="none">None / Standard Account</option>
                  <option value="zelle">Zelle</option>
                  <option value="cashapp">Cash App</option>
                  <option value="check">Check</option>
                </select>
              </div>

              {paymentType !== 'none' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Account Handle / Email
                  </label>
                  <input
                    name="accountHandle"
                    defaultValue={record?.account_handle || ''}
                    placeholder="e.g. $cashtag or zelle email"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Administrative Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={
                  record?.notes
                    ? record.notes.replace(/\[Allocations JSON\]:[\s\S]*$/, '').trim()
                    : ''
                }
                placeholder="Optional notes or context regarding this shareholder..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl focus:bg-white focus:border-blue-600 outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
