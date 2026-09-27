'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createOpportunityValuation } from '@/app/_lib/actions';
import { useToast } from '@/app/_lib/ToastContext';
import {
  ChartBarIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const initialState = { error: false, message: '', success: false };

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(val || 0));

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-md transition-all ${
        pending
          ? 'bg-slate-400 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
      }`}
    >
      {pending ? 'Saving Valuation...' : 'Record Valuation'}
    </button>
  );
}

export default function ValuationsClient({ opportunities = [], initialValuations = [] }) {
  const { showToast } = useToast();
  const router = useRouter();
  const formRef = useRef(null);
  const [state, formAction] = useFormState(createOpportunityValuation, initialState);

  const [selectedOppId, setSelectedOppId] = useState('');
  const [viewMode, setViewMode] = useState('current'); // 'current' or 'history'

  useEffect(() => {
    if (state.success && state.message) {
      showToast(state.message, 'success');
      formRef.current?.reset();
      setSelectedOppId('');
      router.refresh();
    } else if (state.error && state.message) {
      showToast(state.message, 'error');
    }
  }, [state, router, showToast]);

  // Map opportunities to their latest current valuation
  const currentValuations = useMemo(() => {
    return opportunities.map((opp) => {
      const oppVals = initialValuations
        .filter((v) => Number(v.opportunity_id) === Number(opp.id))
        .sort(
          (a, b) =>
            new Date(b.valuation_date) - new Date(a.valuation_date) ||
            b.id - a.id
        );

      const latest = oppVals[0];
      const currentValue = latest
        ? Number(latest.total_asset_value)
        : Number(opp.total_value || 0);

      const lastValuedDate = latest ? latest.valuation_date : opp.created_at;

      return {
        opportunityId: opp.id,
        name: opp.name,
        type: opp.type || 'Standard',
        status: opp.status || 'Active',
        currentValue,
        lastValuedDate,
        hasValuationRecord: Boolean(latest),
        historyCount: oppVals.length,
      };
    });
  }, [opportunities, initialValuations]);

  const selectedOpp = useMemo(() => {
    if (!selectedOppId) return null;
    return currentValuations.find(
      (o) => String(o.opportunityId) === String(selectedOppId)
    );
  }, [selectedOppId, currentValuations]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Opportunity <span className="text-blue-600">Valuations</span>
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Record and manage current Net Asset Values (NAV) for each opportunity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
              {opportunities.length} Opportunities
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <form
            ref={formRef}
            action={formAction}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6"
          >
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Record <span className="text-blue-600">Valuation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set a new NAV baseline for an opportunity.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Opportunity
                </label>
                <div className="relative">
                  <BuildingOffice2Icon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    name="opportunityId"
                    required
                    value={selectedOppId}
                    onChange={(e) => setSelectedOppId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-900"
                  >
                    <option value="">-- Choose Opportunity --</option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Show Current Valuation Snapshot for Selected Opportunity */}
              {selectedOpp && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between animate-in fade-in duration-200">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                      Current Valuation
                    </span>
                    <span className="text-sm font-black text-blue-900">
                      {formatCurrency(selectedOpp.currentValue)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                      Effective Date
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {selectedOpp.lastValuedDate
                        ? new Date(selectedOpp.lastValuedDate).toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )
                        : 'None'}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Total Asset Value ($)
                </label>
                <div className="relative">
                  <BanknotesIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    name="totalAssetValue"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 1500000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Valuation Date
                </label>
                <div className="relative">
                  <CalendarIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    name="valuationDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all text-slate-900"
                  />
                </div>
              </div>
            </div>

            <SubmitButton />
          </form>
        </div>

        {/* Current Valuation Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Current <span className="text-blue-600">Valuation</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Live asset valuation and Net Asset Value (NAV) for each opportunity.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('current')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'current'
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Current Valuations
              </button>
              <button
                type="button"
                onClick={() => setViewMode('history')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'history'
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                History Logs ({initialValuations.length})
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: CURRENT VALUATION PER OPPORTUNITY */}
          {viewMode === 'current' && (
            <div className="bg-white rounded-3xl p-2 sm:p-4 shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">
                        Opportunity
                      </th>
                      <th className="px-4 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                        Current Valuation
                      </th>
                      <th className="px-4 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider">
                        Effective Date
                      </th>
                      <th className="px-4 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider text-center">
                        Status
                      </th>
                      <th className="px-4 py-3.5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentValuations.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          No opportunities found.
                        </td>
                      </tr>
                    ) : (
                      currentValuations.map((opp) => (
                        <tr
                          key={opp.opportunityId}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-4 text-sm">
                            <div className="font-bold text-slate-900">
                              {opp.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              Type: {opp.type}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm font-black text-emerald-600 text-right whitespace-nowrap">
                            {formatCurrency(opp.currentValue)}
                          </td>

                          <td className="px-4 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                            {opp.lastValuedDate ? (
                              <div className="flex items-center gap-1.5">
                                <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>
                                  {new Date(
                                    opp.lastValuedDate
                                  ).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">Initial</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                              {opp.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOppId(String(opp.opportunityId));
                                formRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                });
                              }}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            >
                              Update
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: VALUATION HISTORY LOGS */}
          {viewMode === 'history' && (
            <div className="bg-white rounded-3xl p-2 sm:p-4 shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">
                        Opportunity
                      </th>
                      <th className="px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider text-right">
                        Valuation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {initialValuations.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-4 py-12 text-center text-sm text-slate-500"
                        >
                          No historical valuation records logged yet.
                        </td>
                      </tr>
                    ) : (
                      initialValuations.map((val) => (
                        <tr
                          key={val.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                            {new Date(val.valuation_date).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-800">
                            {val.opportunities?.name || 'Unknown Opportunity'}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-emerald-600 text-right whitespace-nowrap">
                            {formatCurrency(val.total_asset_value)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
