'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  UserIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowUturnLeftIcon,
  DocumentTextIcon,
  LifebuoyIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/solid';

const formatUSD = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val ?? 0);

function NullBadge({ label = 'NULL / Not Set' }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-mono font-bold tracking-tight">
      <ExclamationCircleIcon className="h-3 w-3 text-amber-500" />
      {label}
    </span>
  );
}

function ValueDisplay({ val, isDate = false, isCurrency = false }) {
  if (val === null || val === undefined || val === '') {
    return <NullBadge />;
  }
  if (typeof val === 'boolean') {
    return val ? (
      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" /> TRUE
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
        <XMarkIcon className="h-3.5 w-3.5 text-rose-600" /> FALSE
      </span>
    );
  }
  if (isDate) {
    try {
      return (
        <span className="font-mono text-xs text-slate-700">
          {new Date(val).toLocaleString()}
        </span>
      );
    } catch {
      return <span className="font-mono text-xs text-slate-700">{String(val)}</span>;
    }
  }
  if (isCurrency) {
    return (
      <span className="font-mono font-bold text-xs text-slate-900">
        {formatUSD(val)}
      </span>
    );
  }
  return <span className="text-xs text-slate-800 font-medium break-all">{String(val)}</span>;
}

export default function ShareholderDrillDownModal({
  data,
  isOpen,
  onClose,
  isLoading = false,
}) {
  const [activeTab, setActiveTab] = useState('profile');

  if (!isOpen) return null;

  if (isLoading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-700">
            Loading complete 360° shareholder drill-down...
          </p>
        </div>
      </div>
    );
  }

  const {
    shareholder = {},
    paymentMethod,
    applications = [],
    investments = [],
    payments = [],
    redemptions = [],
    redemptionRequests = [],
    withdrawalForms = [],
    supportTickets = [],
    legacyRecord,
  } = data;

  const activeInvestments = investments.filter(
    (i) => (i.status || '').toLowerCase() === 'active'
  );
  const totalActiveInvested = activeInvestments.reduce(
    (sum, i) => sum + Number(i.amount_invested || 0),
    0
  );
  const totalInvested = investments.reduce(
    (sum, i) => sum + Number(i.amount_invested || 0),
    0
  );
  const totalCurrentValuation = investments.reduce(
    (sum, i) =>
      sum +
      Number(
        i.current_value != null ? i.current_value : i.amount_invested || 0
      ),
    0
  );
  const totalPaid = payments
    .filter((p) => (p.status || '').toLowerCase() === 'succeeded')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalRedeemed = redemptions
    .filter((r) => (r.status || '').toLowerCase() === 'succeeded')
    .reduce((sum, r) => sum + Math.abs(Number(r.amount || 0)), 0);

  const netEquity = totalPaid - totalRedeemed;

  const tabs = [
    { id: 'profile', label: 'Profile & Attributes', icon: <UserIcon className="h-4 w-4" /> },
    {
      id: 'applications',
      label: `Applications (${applications.length})`,
      icon: <DocumentTextIcon className="h-4 w-4" />,
    },
    {
      id: 'investments',
      label: `Investments (${investments.length})`,
      icon: <ChartBarIcon className="h-4 w-4" />,
    },
    {
      id: 'payments',
      label: `Payments (${payments.length})`,
      icon: <CreditCardIcon className="h-4 w-4" />,
    },
    {
      id: 'redemptions',
      label: `Redemptions (${redemptions.length})`,
      icon: <ArrowUturnLeftIcon className="h-4 w-4" />,
    },
    {
      id: 'payout',
      label: 'Payout Rail',
      icon: <BuildingLibraryIcon className="h-4 w-4" />,
    },
    {
      id: 'support',
      label: `Support (${supportTickets.length})`,
      icon: <LifebuoyIcon className="h-4 w-4" />,
    },
    { id: 'raw', label: 'Raw JSON Audit', icon: <CodeBracketIcon className="h-4 w-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-primary-950 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-xl font-black text-blue-300">
              {shareholder.fullName ? shareholder.fullName.charAt(0).toUpperCase() : '#'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  {shareholder.fullName || <span className="text-slate-400 italic">No Name (NULL)</span>}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-700">
                  ID: #{shareholder.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    shareholder.shareholderStatus === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {shareholder.shareholderStatus || 'Status: NULL'}
                </span>
                {shareholder.isDirector && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <ShieldCheckIcon className="h-3.5 w-3.5" /> Director
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {shareholder.email || 'email: NULL'} {shareholder.telephone ? `• ${shareholder.telephone}` : '• phone: NULL'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* FINANCIAL SUMMARY KPI CARDS */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Active Investments
            </span>
            <span className="text-lg font-black text-blue-700 block mt-0.5 font-mono">
              {formatUSD(totalActiveInvested > 0 ? totalActiveInvested : totalInvested)}
            </span>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>{investments.length} allocation{investments.length === 1 ? '' : 's'}</span>
              {totalCurrentValuation !== totalInvested && totalCurrentValuation > 0 && (
                <span className="text-emerald-600 font-bold ml-1 font-mono text-[10px]" title="Current Valuation">
                  Val: {formatUSD(totalCurrentValuation)}
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Total Inflows Paid
            </span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5 font-mono">
              {formatUSD(totalPaid)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {payments.filter((p) => p.status === 'succeeded').length} succeeded payments
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Total Redemptions Paid
            </span>
            <span className="text-lg font-black text-red-600 block mt-0.5 font-mono">
              {formatUSD(-totalRedeemed)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {redemptions.length} payout transaction{redemptions.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Net Capital In Account
            </span>
            <span className="text-lg font-black text-slate-900 block mt-0.5 font-mono">
              {formatUSD(netEquity)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Net balance
            </span>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-6 bg-white border-b border-slate-200 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENTS (SCROLLABLE BODY) */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar bg-slate-50/50">
          {/* TAB 1: PROFILE & ATTRIBUTES AUDIT (HIGHLIGHTING NULLS) */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-blue-600" />
                    Shareholders Table Full Attribute Audit
                  </h3>
                  <span className="text-xs text-slate-500">
                    Inspecting every database column (null values flagged)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'Database ID (id)', val: shareholder.id },
                    { label: 'Full Legal Name (fullName)', val: shareholder.fullName },
                    { label: 'Primary Email (email)', val: shareholder.email },
                    { label: 'Telephone (telephone)', val: shareholder.telephone },
                    { label: 'Nationality (nationality)', val: shareholder.nationality },
                    { label: 'Shareholder Status (shareholderStatus)', val: shareholder.shareholderStatus },
                    { label: 'Share Percentage (sharePercentage)', val: shareholder.sharePercentage != null ? `${shareholder.sharePercentage}%` : null },
                    { label: 'Is Director (isDirector)', val: shareholder.isDirector },
                    { label: 'Auth User ID (auth_user_id)', val: shareholder.auth_user_id },
                    { label: 'Created At (created_at)', val: shareholder.created_at, isDate: true },
                    { label: 'Updated At (updated_at)', val: shareholder.updated_at, isDate: true },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        {field.label}
                      </span>
                      <ValueDisplay
                        val={field.val}
                        isDate={field.isDate}
                        isCurrency={field.isCurrency}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVED PAYOUT METHOD AUDIT */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <BuildingLibraryIcon className="h-4 w-4 text-emerald-600" />
                    Shareholder Payment Method on File
                  </h3>
                  <span className="text-xs text-slate-500">
                    shareholder_payment_methods table
                  </span>
                </div>

                {!paymentMethod ? (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center gap-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold block">No Saved Payment Method</span>
                      This shareholder has not configured an offline payout method (Zelle, CashApp, Check, Wire).
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Payment Type
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-xs uppercase border border-blue-200">
                        {paymentMethod.payment_type || <NullBadge />}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Account Name
                      </span>
                      <ValueDisplay val={paymentMethod.account_name} />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Account Handle / Tag
                      </span>
                      <ValueDisplay val={paymentMethod.account_handle} />
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                        Account Number
                      </span>
                      <ValueDisplay val={paymentMethod.account_number} />
                    </div>
                  </div>
                )}
              </div>

              {/* LEGACY RECORD IF CLAIMED */}
              {legacyRecord && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ShieldCheckIcon className="h-4 w-4 text-purple-600" />
                    Legacy Pre-Stage Record (Migrated)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                      <span className="text-slate-400 uppercase font-bold block text-[10px]">Staging Record ID</span>
                      <span className="font-mono font-bold text-purple-900">#{legacyRecord.id}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                      <span className="text-slate-400 uppercase font-bold block text-[10px]">Total Staged Capital</span>
                      <span className="font-mono font-bold text-purple-900">{formatUSD(legacyRecord.amount_invested)}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200">
                      <span className="text-slate-400 uppercase font-bold block text-[10px]">Staging Notes</span>
                      <span className="text-purple-900 font-medium truncate block">{legacyRecord.notes || 'None'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 text-xs">
                  No membership applications on record for this shareholder.
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800">
                          App #{app.id}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            app.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : app.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {app.status || <NullBadge />}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Submitted: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          App Fee Paid
                        </span>
                        <ValueDisplay val={app.application_fee_paid} />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Operating Agreement Signed
                        </span>
                        <ValueDisplay val={app.operating_agreement_signed} />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Agreement Signed At
                        </span>
                        <ValueDisplay val={app.agreement_signed_at} isDate={true} />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Decision Result
                        </span>
                        <ValueDisplay val={app.decision_result} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Primary Interest
                        </span>
                        <ValueDisplay val={app.primary_interest} />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Experience Description
                        </span>
                        <ValueDisplay val={app.experience_description} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: INVESTMENTS */}
          {activeTab === 'investments' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Investments & Opportunity Allocations ({investments.length})
                </h3>
                <span className="text-xs font-mono font-bold text-blue-700">
                  Total: {formatUSD(totalInvested)}
                </span>
              </div>

              {investments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No investments recorded for this shareholder.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Opportunity</th>
                        <th className="py-3 px-4 text-right">Amount Invested</th>
                        <th className="py-3 px-4 text-right">Current Value</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Start Date</th>
                        <th className="py-3 px-4">Exited At</th>
                        <th className="py-3 px-4">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investments.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {inv.opportunities?.name || `Opp #${inv.opportunity_id}`}
                            <span className="block text-[10px] font-normal text-slate-400">
                              Type: {inv.opportunities?.type || <NullBadge />}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                            {formatUSD(inv.amount_invested)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {inv.current_value != null ? formatUSD(inv.current_value) : <NullBadge />}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                inv.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {inv.status || <NullBadge />}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {inv.start_date || <NullBadge />}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {inv.exited_at ? new Date(inv.exited_at).toLocaleDateString() : <NullBadge />}
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={inv.notes}>
                            {inv.notes || <NullBadge />}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Payments & Inflows Ledger ({payments.length})
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-700">
                  Total Succeeded: {formatUSD(totalPaid)}
                </span>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No payment records found for this shareholder.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Line Item / Memo</th>
                        <th className="py-3 px-4">Method / Type</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Stripe Intent / Ref</th>
                        <th className="py-3 px-4">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate" title={p.description}>
                            {p.description || p.opportunities?.name || p.fees?.name || `Payment #${p.id}`}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border border-slate-200">
                              {p.payment_method_type || p.type || 'Manual'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                            {formatUSD(p.amount)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                p.status === 'succeeded'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status || <NullBadge />}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[140px]" title={p.stripe_payment_intent_id}>
                            {p.stripe_payment_intent_id || <NullBadge />}
                          </td>
                          <td className="py-3 px-4">
                            {p.receipt_url ? (
                              <a
                                href={p.receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 text-[11px]"
                              >
                                View <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                              </a>
                            ) : (
                              <NullBadge />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REDEMPTIONS */}
          {activeTab === 'redemptions' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Redemption Payouts ({redemptions.length})
                </h3>
                <span className="text-xs font-mono font-bold text-red-600">
                  Total Outflow: {formatUSD(-totalRedeemed)}
                </span>
              </div>

              {redemptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No redemption payouts processed for this shareholder.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Payout Rail</th>
                        <th className="py-3 px-4">Reference #</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Recipient Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {redemptions.map((r) => {
                        const meta = r.metadata || {};
                        const rail = meta.payout_rail || (r.stripe_refund_id ? 'Stripe' : 'Manual');
                        const ref = meta.reference_number || r.stripe_refund_id;
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {new Date(r.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate" title={r.description}>
                              {r.description || `Redemption #${r.id}`}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] uppercase border border-blue-200">
                                {rail}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-slate-600 truncate max-w-[140px]" title={ref}>
                              {ref || <NullBadge />}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                              {formatUSD(r.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800">
                                {r.status || <NullBadge />}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {meta.recipient_name || meta.recipient_handle ? (
                                <span className="text-xs">
                                  {meta.recipient_name} ({meta.recipient_handle})
                                </span>
                              ) : (
                                <NullBadge />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PAYOUT & WITHDRAWAL REQUESTS */}
          {activeTab === 'payout' && (
            <div className="space-y-6">
              {/* REDEMPTION REQUESTS */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                  Redemption Requests Log ({redemptionRequests.length})
                </h3>

                {redemptionRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No redemption requests initiated.</p>
                ) : (
                  <div className="space-y-3">
                    {redemptionRequests.map((req) => (
                      <div key={req.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-mono">
                            Request #{req.id} • Goal: {formatUSD(req.amount)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-blue-100 text-blue-800">
                            {req.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                          <div>
                            <span className="font-bold text-slate-400 block">Already Redeemed:</span>
                            <span className="font-mono">{formatUSD(req.already_redeemed_so_far || 0)}</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block">Reason Code:</span>
                            <ValueDisplay val={req.reason_code} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-400 block">Created At:</span>
                            <ValueDisplay val={req.created_at} isDate={true} />
                          </div>
                        </div>
                        {req.admin_notes && (
                          <div className="pt-2 border-t border-slate-200/60 text-slate-500 font-mono text-[11px]">
                            <span className="font-bold text-slate-700">Admin Notes: </span>
                            {req.admin_notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MEMBER WITHDRAWAL FORMS */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                  Member Withdrawal Forms ({withdrawalForms.length})
                </h3>

                {withdrawalForms.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No formal member withdrawal forms on file.</p>
                ) : (
                  <div className="space-y-3">
                    {withdrawalForms.map((wf) => (
                      <div key={wf.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-slate-800 block">
                            Form ID: {wf.id}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            Linked Request #{wf.redemption_request_id || <NullBadge />} • Opportunity #{wf.opportunity_id || <NullBadge />}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-100 text-emerald-800">
                          {wf.status || <NullBadge />}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SUPPORT TICKETS */}
          {activeTab === 'support' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Support Inquiries & Tickets ({supportTickets.length})
              </h3>

              {supportTickets.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No support tickets submitted by this shareholder.</p>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 block text-sm">
                          {t.subject || 'Ticket #' + t.id}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Created: {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-blue-100 text-blue-800">
                        {t.status || 'open'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: RAW JSON AUDIT */}
          {activeTab === 'raw' && (
            <div className="bg-slate-900 text-slate-200 p-5 rounded-3xl font-mono text-xs overflow-x-auto shadow-inner space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2">
                <span>Complete Raw Database Audit (JSON)</span>
                <span className="text-[10px] text-emerald-400">Read-Only</span>
              </div>
              <pre className="text-[11px] leading-relaxed custom-scrollbar">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Drill Down
          </button>
        </div>
      </div>
    </div>
  );
}
