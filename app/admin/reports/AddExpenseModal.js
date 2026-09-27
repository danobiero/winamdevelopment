'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  TagIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { addOperatingExpenseAction, updateOperatingExpenseAction } from './actions';
import { getOpportunities } from '@/app/admin/opportunities/actions';

export default function AddExpenseModal({
  isOpen,
  onClose,
  onExpenseAdded,
  opportunityId = 9,
  opportunities = [],
  expenseToEdit = null,
}) {
  const { showToast } = useToast();
  const [oppList, setOppList] = useState(opportunities || []);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(
    expenseToEdit?.opportunity_id || opportunityId || (opportunities?.[0]?.id ?? 9)
  );
  const [expenseDate, setExpenseDate] = useState(
    () => expenseToEdit?.expense_date || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState(
    () => expenseToEdit?.category || 'Payment Processing'
  );
  const [description, setDescription] = useState(
    () => expenseToEdit?.description || ''
  );
  const [amount, setAmount] = useState(
    () => (expenseToEdit?.amount != null ? String(expenseToEdit.amount) : '')
  );
  const [vendor, setVendor] = useState(
    () => expenseToEdit?.vendor || ''
  );
  const [paymentMethod, setPaymentMethod] = useState(
    () => expenseToEdit?.payment_method || 'Card'
  );
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (expenseToEdit) {
      setSelectedOpportunityId(
        expenseToEdit.opportunity_id || opportunityId || (oppList[0]?.id ?? 9)
      );
      setExpenseDate(
        expenseToEdit.expense_date || new Date().toISOString().split('T')[0]
      );
      setCategory(expenseToEdit.category || 'Payment Processing');
      setDescription(expenseToEdit.description || '');
      setAmount(
        expenseToEdit.amount != null ? String(expenseToEdit.amount) : ''
      );
      setVendor(expenseToEdit.vendor || '');
      setPaymentMethod(expenseToEdit.payment_method || 'Card');
    } else {
      if (opportunityId) {
        setSelectedOpportunityId(opportunityId);
      } else if (oppList.length > 0 && !selectedOpportunityId) {
        setSelectedOpportunityId(oppList[0].id);
      }
    }
  }, [expenseToEdit, isOpen, opportunityId, oppList]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedOpportunityId) {
      showToast('Please select an investment opportunity.', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('Please enter a description for the expense.', 'error');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid expense amount greater than 0.', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      if (expenseToEdit?.id) {
        formData.append('id', String(expenseToEdit.id));
      }
      formData.append('expense_date', expenseDate);
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('amount', String(numAmount));
      formData.append('vendor', vendor.trim());
      formData.append('payment_method', paymentMethod);
      formData.append('opportunity_id', String(selectedOpportunityId));

      const res = expenseToEdit?.id
        ? await updateOperatingExpenseAction(formData)
        : await addOperatingExpenseAction(formData);

      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          expenseToEdit ? 'Expense updated successfully.' : 'Expense recorded successfully.',
          'success'
        );
        if (onExpenseAdded) onExpenseAdded(res.expense);
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
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="bg-[#000033] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <BanknotesIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {expenseToEdit ? 'Edit Operating Expense' : 'Record Operating Expense'}
              </h3>
              <p className="text-xs text-slate-300">
                {expenseToEdit
                  ? 'Modify actual disbursement details in operating_expenses'
                  : 'Track actual disbursements in the operating_expenses table'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Opportunity Selection */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-amber-600" />
              <span>Investment Opportunity / Project</span>
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

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              >
                <option value="Payment Processing">Payment Processing</option>
                <option value="Legal & Professional">Legal & Professional</option>
                <option value="Fund Administration">Fund Administration</option>
                <option value="Technology & Software">Technology & Software</option>
                <option value="Marketing & Compliance">Marketing & Compliance</option>
                <option value="Other Operating">Other Operating</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Purpose</label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe Merchant Processing Fees, Franchise Tax, Audit, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
            />
          </div>

          {/* Amount & Vendor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Amount ($ USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vendor / Payee</label>
              <input
                type="text"
                placeholder="e.g. Stripe, State Govt, AWS, Legal Counsel"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:bg-white focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Disbursement Method</label>
            <div className="grid grid-cols-4 gap-2">
              {['Card', 'Wire', 'ACH', 'Other'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
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
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <PlusIcon className="h-4 w-4" />
                  <span>{expenseToEdit ? 'Save Changes' : 'Record Expense'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
