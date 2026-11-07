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
import { updatePaymentAction } from '@/app/admin/payments/payment-actions';
import { getOpportunities } from '@/app/admin/opportunities/actions';

const getCoreOpportunityId = (opps) => {
  if (!opps || opps.length === 0) return 9;
  const coreOpp = opps.find(
    (o) =>
      o.type?.toLowerCase() === 'core' ||
      o.name?.toLowerCase().includes('core')
  );
  return coreOpp ? coreOpp.id : (opps[0]?.id ?? 9);
};

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onPaymentAdded,
  opportunityId,
  opportunities = [],
  shareholders = [],
  paymentToEdit = null,
}) {
  const { showToast } = useToast();

  const [oppList, setOppList] = useState(opportunities || []);
  const [shareholderList, setShareholderList] = useState(shareholders || []);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState(() =>
    paymentToEdit?.opportunity_id || opportunityId || getCoreOpportunityId(opportunities)
  );
  const [selectedShareholderId, setSelectedShareholderId] = useState(() =>
    paymentToEdit?.shareholder_id ? String(paymentToEdit.shareholder_id) : ''
  );
  const [shareholderSearch, setShareholderSearch] = useState('');

  const [amount, setAmount] = useState(() =>
    paymentToEdit?.amount != null ? String(paymentToEdit.amount) : ''
  );
  const [paymentDate, setPaymentDate] = useState(() =>
    paymentToEdit?.created_at
      ? paymentToEdit.created_at.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState(() =>
    paymentToEdit?.metadata?.payment_method ||
    (paymentToEdit?.payment_method_type
      ? paymentToEdit.payment_method_type.charAt(0).toUpperCase() + paymentToEdit.payment_method_type.slice(1)
      : 'Wire')
  );
  const [paymentType, setPaymentType] = useState(() =>
    paymentToEdit?.type || 'capital_subscription'
  );
  const [paymentStatus, setPaymentStatus] = useState(() =>
    paymentToEdit?.status || 'succeeded'
  );
  const [reference, setReference] = useState(() =>
    paymentToEdit?.stripe_payment_intent_id || paymentToEdit?.metadata?.reference || ''
  );
  const [description, setDescription] = useState(() =>
    paymentToEdit?.description || ''
  );
  const [notes, setNotes] = useState(() =>
    paymentToEdit?.metadata?.notes || ''
  );
  const [loading, setLoading] = useState(false);

  // Load opportunities fallback if not provided
  useEffect(() => {
    if (opportunities && opportunities.length > 0) {
      setOppList(opportunities);
      if (!paymentToEdit && !opportunityId && !selectedOpportunityId) {
        setSelectedOpportunityId(getCoreOpportunityId(opportunities));
      }
    } else {
      getOpportunities()
        .then((data) => {
          if (data && data.length > 0) {
            setOppList(data);
            if (!paymentToEdit && !opportunityId && !selectedOpportunityId) {
              setSelectedOpportunityId(getCoreOpportunityId(data));
            }
          }
        })
        .catch(() => {});
    }
  }, [opportunities, paymentToEdit, opportunityId, selectedOpportunityId]);

  // Load shareholders fallback if not provided (DO NOT pre-populate shareholder)
  useEffect(() => {
    if (shareholders && shareholders.length > 0) {
      setShareholderList(shareholders);
    } else {
      getShareholdersList()
        .then((data) => {
          if (data && data.length > 0) {
            setShareholderList(data);
          }
        })
        .catch(() => {});
    }
  }, [shareholders]);

  // Sync edit mode fields when paymentToEdit changes
  useEffect(() => {
    if (paymentToEdit) {
      setSelectedOpportunityId(paymentToEdit.opportunity_id || getCoreOpportunityId(oppList));
      setSelectedShareholderId(paymentToEdit.shareholder_id ? String(paymentToEdit.shareholder_id) : '');
      setAmount(paymentToEdit.amount != null ? String(paymentToEdit.amount) : '');
      setPaymentDate(paymentToEdit.created_at ? paymentToEdit.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
      const method = paymentToEdit.metadata?.payment_method ||
        (paymentToEdit.payment_method_type
          ? paymentToEdit.payment_method_type.charAt(0).toUpperCase() + paymentToEdit.payment_method_type.slice(1)
          : 'Wire');
      setPaymentMethod(method);
      setPaymentType(paymentToEdit.type || 'capital_subscription');
      setPaymentStatus(paymentToEdit.status || 'succeeded');
      setReference(paymentToEdit.stripe_payment_intent_id || paymentToEdit.metadata?.reference || '');
      setDescription(paymentToEdit.description || '');
      setNotes(paymentToEdit.metadata?.notes || '');
    } else {
      if (!opportunityId) {
        setSelectedOpportunityId(getCoreOpportunityId(oppList));
      }
      setSelectedShareholderId('');
    }
  }, [paymentToEdit, oppList, opportunityId]);

  // Sync opportunityId prop
  useEffect(() => {
    if (opportunityId) {
      setSelectedOpportunityId(opportunityId);
    } else if (oppList.length > 0 && !selectedOpportunityId && !paymentToEdit) {
      setSelectedOpportunityId(getCoreOpportunityId(oppList));
    }
  }, [opportunityId, oppList, selectedOpportunityId, paymentToEdit]);

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
      formData.append('status', paymentStatus);
      if (reference.trim()) formData.append('reference', reference.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      let res;
      if (paymentToEdit?.id) {
        res = await updatePaymentAction(paymentToEdit.id, formData);
      } else {
        res = await recordPaymentAction(formData);
      }

      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          paymentToEdit ? 'Payment updated successfully.' : 'Payment recorded and synced successfully.',
          'success'
        );
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
              <h3 className="text-base font-bold text-white">
                {paymentToEdit ? 'Edit Payment Record' : 'Record a Payment'}
              </h3>
              <p className="text-xs text-slate-300">
                {paymentToEdit
                  ? 'Update payment details and allocation in the ledger'
                  : 'Record investor capital contributions and subscription payments'}
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
              <span className="text-xs text-slate-500 font-medium">
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
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
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
                  className={`py-1.5 px-2 rounded-xl font-bold text-xs transition-all cursor-pointer text-center ${
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

          {/* Payment Type, Status & Reference Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Classification</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="capital_subscription">Capital Subscription</option>
                <option value="investment">Direct Investment</option>
                <option value="fee">Application / Service Fee</option>
                <option value="dividend">Dividend Payout</option>
                <option value="manual">Manual Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="succeeded">Succeeded / Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed / Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reference / Transaction ID
              </label>
              <input
                type="text"
                placeholder="e.g. Wire Ref #, Check #"
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
              placeholder="e.g. Confirmed bank clearing on statement"
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
                  <span>{paymentToEdit ? 'Saving...' : 'Recording...'}</span>
                </>
              ) : (
                <>
                  {paymentToEdit ? (
                    <CheckCircleIcon className="h-4 w-4" />
                  ) : (
                    <PlusIcon className="h-4 w-4" />
                  )}
                  <span>{paymentToEdit ? 'Save Changes' : 'Record Payment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
