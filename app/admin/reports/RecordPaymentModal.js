'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { recordPaymentAction, getShareholdersList } from './actions';
import { getOpportunities } from '@/app/admin/opportunities/actions';

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onPaymentAdded,
  opportunityId,
  opportunities = [],
  shareholders = [],
}) {
  const { showToast } = useToast();

  const [oppList, setOppList] = useState(opportunities || []);
  const [shareholderList, setShareholderList] = useState(shareholders || []);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    opportunityId || (opportunities?.[0]?.id ?? 9)
  );
  const [selectedShareholderId, setSelectedShareholderId] = useState('');
  const [shareholderSearch, setShareholderSearch] = useState('');

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState('Wire');
  const [paymentType, setPaymentType] = useState('capital_subscription');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Load opportunities fallback if not provided
  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      setOppList(opportunities);
    } else {
      getOpportunities()
        .then((data) => {
          if (data && data.length > 0) setOppList(data);
        })
        .catch(() => {});
    }
  }, [opportunities]);

  // Load shareholders fallback if not provided
  useEffect(() => {
    if (shareholders && shareholders.length > 0) {
      setShareholderList(shareholders);
      if (!selectedShareholderId && shareholders[0]?.id) {
        setSelectedShareholderId(String(shareholders[0].id));
      }
    } else {
      getShareholdersList()
        .then((data) => {
          if (data && data.length > 0) {
            setShareholderList(data);
            if (!selectedShareholderId) {
              setSelectedShareholderId(String(data[0].id));
            }
          }
        })
        .catch(() => {});
    }
  }, [shareholders, selectedShareholderId]);

  // Sync opportunityId prop
  useEffect(() => {
    if (opportunityId) {
      setSelectedOpportunityId(opportunityId);
    } else if (oppList.length > 0 && !selectedOpportunityId) {
      setSelectedOpportunityId(oppList[0].id);
    }
  }, [opportunityId, oppList, selectedOpportunityId]);

  // Filtered shareholders based on search query
  const filteredShareholders = useMemo(() => {
    if (!shareholderSearch.trim()) return shareholderList;
    const q = shareholderSearch.toLowerCase();
    return shareholderList.filter(
      (sh) =>
        sh.fullName?.toLowerCase().includes(q) ||
        sh.email?.toLowerCase().includes(q)
    );
  }, [shareholderList, shareholderSearch]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedOpportunityId) {
      showToast('Please select an investment opportunity.', 'error');
      return;
    }

    if (!selectedShareholderId) {
      showToast('Please select a shareholder / investor.', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid payment amount greater than 0.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('opportunity_id', String(selectedOpportunityId));
      formData.append('shareholder_id', String(selectedShareholderId));
      formData.append('amount', String(numAmount));
      formData.append('payment_date', paymentDate);
      formData.append('payment_method', paymentMethod);
      formData.append('type', paymentType);
      formData.append('status', 'succeeded');
      if (reference.trim()) formData.append('reference', reference.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await recordPaymentAction(formData);

      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Payment recorded and synced successfully.', 'success');
        if (onPaymentAdded) onPaymentAdded(res.payment);
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
        <div className="bg-[#000033] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record a Payment</h3>
              <p className="text-xs text-slate-300">
                Record investor capital contributions and subscription payments
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
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-amber-600" />
              <span>Investment Opportunity</span>
              <span className="text-amber-600 font-black">*</span>
            </label>
            <select
              value={selectedOpportunityId}
              onChange={(e) => setSelectedOpportunityId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer"
            >
              {oppList && oppList.length > 0 ? (
                oppList.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.name} {opp.type ? `(${opp.type})` : ''}
                  </option>
                ))
              ) : (
                <option value={selectedOpportunityId || 9}>
                  Core Portfolio Equity (ID: {selectedOpportunityId || 9})
                </option>
              )}
            </select>
          </div>

          {/* Shareholder Selector with Search Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-blue-600" />
                <span>Shareholder / Investor</span>
                <span className="text-amber-600 font-black">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {filteredShareholders.length} investors found
              </span>
            </div>

            {/* Quick search input if more than 5 shareholders */}
            {shareholderList.length > 5 && (
              <div className="relative mb-2">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type name or email to filter shareholders..."
                  value={shareholderSearch}
                  onChange={(e) => setShareholderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>
            )}

            <select
              value={selectedShareholderId}
              onChange={(e) => setSelectedShareholderId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="" disabled>
                -- Select Shareholder --
              </option>
              {filteredShareholders.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.fullName || 'Anonymous Investor'} ({sh.email || 'No Email'})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Amount ($ USD) <span className="text-amber-600 font-black">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Payment Date <span className="text-amber-600 font-black">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {['Wire', 'ACH', 'Card', 'Manual', 'Check', 'Other'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer text-center ${
                    paymentMethod === method
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Type & Reference Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Classification</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              >
                <option value="capital_subscription">Capital Subscription</option>
                <option value="investment">Direct Investment</option>
                <option value="fee">Application / Service Fee</option>
                <option value="manual">Manual Admin Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reference / Transaction ID
              </label>
              <input
                type="text"
                placeholder="e.g. Wire Ref #, Check #, Stripe Intent"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Description / Memo
            </label>
            <input
              type="text"
              placeholder="e.g. Capital subscription for Core Portfolio Equity"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Internal Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Confirmed bank clearing on Morgan Stanley / Chase statement"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
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
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
