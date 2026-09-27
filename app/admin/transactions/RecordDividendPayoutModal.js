'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  XMarkIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { recordDividendPayoutAction } from '@/app/admin/reports/actions';

const formatUSD = (val) =>
  `$${Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function RecordDividendPayoutModal({
  isOpen,
  onClose,
  onPayoutAdded,
  opportunities = [],
  shareholders = [],
}) {
  const { showToast } = useToast();

  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    opportunities?.[0]?.id ? String(opportunities[0].id) : ''
  );
  const [selectedShareholderId, setSelectedShareholderId] = useState(
    shareholders?.[0]?.id ? String(shareholders[0].id) : ''
  );
  const [shareholderSearch, setShareholderSearch] = useState('');

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [payoutRail, setPayoutRail] = useState('wire');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  // Shareholder payment details
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHandle, setAccountHandle] = useState('');

  const [loading, setLoading] = useState(false);

  // Sync default opportunity
  useEffect(() => {
    if (!selectedOpportunityId && opportunities.length > 0) {
      setSelectedOpportunityId(String(opportunities[0].id));
    }
  }, [opportunities, selectedOpportunityId]);

  // Selected Opportunity Info
  const selectedOpportunity = useMemo(() => {
    return (
      opportunities.find((o) => String(o.id) === String(selectedOpportunityId)) ||
      null
    );
  }, [opportunities, selectedOpportunityId]);

  // Filtered Shareholders
  const filteredShareholders = useMemo(() => {
    if (!shareholderSearch.trim()) return shareholders;
    const q = shareholderSearch.toLowerCase();
    return shareholders.filter(
      (sh) =>
        sh.fullName?.toLowerCase().includes(q) ||
        sh.email?.toLowerCase().includes(q) ||
        String(sh.id).includes(q)
    );
  }, [shareholders, shareholderSearch]);

  // Selected Shareholder Info & Registered Payout Method
  const selectedShareholder = useMemo(() => {
    return (
      shareholders.find((sh) => String(sh.id) === String(selectedShareholderId)) ||
      null
    );
  }, [shareholders, selectedShareholderId]);

  // When shareholder changes, auto-populate their registered payout info!
  useEffect(() => {
    if (selectedShareholder) {
      const pm = selectedShareholder.payment_method;
      if (pm) {
        setPayoutRail(pm.payment_type || 'wire');
        setAccountName(pm.account_name || selectedShareholder.fullName || '');
        setAccountNumber(pm.account_number || '');
        setAccountHandle(pm.account_handle || '');
      } else {
        setAccountName(selectedShareholder.fullName || '');
        setAccountNumber('');
        setAccountHandle(selectedShareholder.email || '');
      }
    }
  }, [selectedShareholder]);

  // Auto-generate memo when opportunity changes
  useEffect(() => {
    if (selectedOpportunity) {
      setDescription(`Dividend Payout - ${selectedOpportunity.name}`);
    }
  }, [selectedOpportunity]);

  if (!isOpen) return null;

  // Valuation Math
  const currentAssetValue = Number(selectedOpportunity?.current_asset_value ?? selectedOpportunity?.total_value ?? 0);
  const payoutAmount = Number(amount) || 0;
  const newAssetValue = Math.max(0, currentAssetValue - payoutAmount);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedOpportunityId) {
      showToast('Please select an opportunity for the dividend payout.', 'error');
      return;
    }

    if (!selectedShareholderId) {
      showToast('Please select a recipient shareholder.', 'error');
      return;
    }

    if (payoutAmount <= 0) {
      showToast('Please enter a valid dividend amount greater than $0.00.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('opportunity_id', String(selectedOpportunityId));
      formData.append('shareholder_id', String(selectedShareholderId));
      formData.append('amount', String(payoutAmount));
      formData.append('payment_date', paymentDate);
      formData.append('payout_rail', payoutRail);
      formData.append('payment_method', payoutRail);
      formData.append('account_name', accountName);
      formData.append('account_number', accountNumber);
      formData.append('account_handle', accountHandle);
      if (reference.trim()) formData.append('reference', reference.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await recordDividendPayoutAction(formData);

      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          `Dividend payout of ${formatUSD(payoutAmount)} recorded. Asset value reduced.`,
          'success'
        );
        if (onPayoutAdded) onPayoutAdded(res.payment);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30">
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Disburse Dividend Payout</h3>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  Asset Reduction
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Disburse dividends from an opportunity to a shareholder using their registered payment rails
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar">
          {/* Opportunity Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <BuildingOffice2Icon className="h-3.5 w-3.5 text-purple-600" />
                <span>Source Opportunity</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              {selectedOpportunity && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Asset NAV: <strong className="text-slate-800">{formatUSD(currentAssetValue)}</strong>
                </span>
              )}
            </div>

            <select
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all cursor-pointer"
            >
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.name} ({opp.type || 'Equity'}) — NAV: {formatUSD(opp.current_asset_value ?? opp.total_value ?? 0)}
                </option>
              ))}
            </select>
          </div>

          {/* Shareholder Selector with Search Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>Recipient Shareholder</span>
                <span className="text-rose-500 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {filteredShareholders.length} shareholders found
              </span>
            </div>

            {/* Quick search input */}
            {shareholders.length > 5 && (
              <div className="relative mb-2">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type name, email, or ID to filter..."
                  value={shareholderSearch}
                  onChange={(e) => setShareholderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700 outline-none focus:bg-white focus:border-purple-500 transition-all"
                />
              </div>
            )}

            <select
              value={selectedShareholderId}
              onChange={(e) => setSelectedShareholderId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Select Shareholder --
              </option>
              {filteredShareholders.map((sh) => {
                const hasPm = !!sh.payment_method;
                return (
                  <option key={sh.id} value={sh.id}>
                    {sh.fullName || 'Anonymous'} ({sh.email || 'No email'}) {hasPm ? `• Rail: ${sh.payment_method.payment_type?.toUpperCase()}` : '• (No rail saved)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* SHAREHOLDER REGISTERED PAYMENT INFORMATION CARD */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <CreditCardIcon className="h-4 w-4 text-purple-600" />
                <span>Shareholder Payout Destination (On File)</span>
              </span>

              {selectedShareholder?.payment_method ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Registered Rail: {selectedShareholder.payment_method.payment_type?.toUpperCase()}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  No Rail on File
                </span>
              )}
            </div>

            {selectedShareholder?.payment_method ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px] text-slate-700">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Account Name</span>
                  <span className="font-bold truncate block">{selectedShareholder.payment_method.account_name || selectedShareholder.fullName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Account / Routing #</span>
                  <span className="font-bold truncate block">
                    {selectedShareholder.payment_method.account_number
                      ? `•••• ${selectedShareholder.payment_method.account_number.slice(-4)}`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block font-sans">Handle / Email / Phone</span>
                  <span className="font-bold truncate block">{selectedShareholder.payment_method.account_handle || selectedShareholder.email || '—'}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 font-medium">
                This shareholder has not yet registered an automated payout rail. You can designate the payout rail below and record manual bank clearing.
              </p>
            )}
          </div>

          {/* Dividend Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dividend Amount ($ USD) <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-purple-500 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Distribution Date <span className="text-rose-500 font-black">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* DYNAMIC ASSET VALUE IMPACT CALCULATION */}
          {payoutAmount > 0 && selectedOpportunity && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">Current Asset NAV</span>
                <span className="font-bold text-slate-700">{formatUSD(currentAssetValue)}</span>
              </div>
              <div className="text-rose-600 font-bold">
                <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block text-right">Dividend Paid</span>
                <span>-{formatUSD(payoutAmount)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-400 font-sans block">New Asset NAV</span>
                <span className="font-black text-purple-700 text-sm">{formatUSD(newAssetValue)}</span>
              </div>
            </div>
          )}

          {/* Payout Rail Method Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Disbursement Method / Rail</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {['Wire', 'ACH', 'Zelle', 'CashApp', 'Check', 'Manual'].map((method) => {
                const isSelected = payoutRail.toLowerCase() === method.toLowerCase();
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPayoutRail(method.toLowerCase())}
                    className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-purple-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference / Confirmation ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Transaction Reference / Confirmation #
              </label>
              <input
                type="text"
                placeholder="e.g. Wire Confirmation #, Zelle Ref, Check #"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Description / Memo
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Administrative Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Verified by finance committee, cleared via JPMorgan Chase"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-purple-500 transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg shadow-purple-900/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Processing Payout...</span>
                </>
              ) : (
                <>
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                  <span>Confirm Dividend Payout</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
