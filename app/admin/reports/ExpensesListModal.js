'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  XMarkIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  ReceiptPercentIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  BanknotesIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { getAllOperatingExpenses, deleteOperatingExpenseAction } from './actions';
import AddExpenseModal from './AddExpenseModal';
import DeleteExpenseModal from './DeleteExpenseModal';

const formatUSD = (amount) => {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function ExpensesListModal({
  isOpen,
  onClose,
  opportunities = [],
  onExpenseUpdated,
}) {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Add / Edit Modal state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  async function loadExpenses() {
    setLoading(true);
    try {
      const data = await getAllOperatingExpenses({
        opportunityId: selectedOpportunityFilter !== 'ALL' ? selectedOpportunityFilter : undefined,
      });
      setExpenses(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to load expenses', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    await loadExpenses();
    showToast('Expenses list updated.', 'success');
  };

  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExpenses();
    }
  }, [isOpen, selectedOpportunityFilter]);

  // Handle Confirm Delete via Pop Up
  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeleting(true);
      const res = await deleteOperatingExpenseAction(expenseToDelete.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Expense record deleted.', 'warning');
        setExpenseToDelete(null);
        await loadExpenses();
        if (onExpenseUpdated) onExpenseUpdated();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered expenses by search query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const q = searchQuery.toLowerCase();
    return expenses.filter((e) => {
      const vendor = (e.vendor || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const cat = (e.category || '').toLowerCase();
      const opp = (e.opportunities?.name || '').toLowerCase();
      return vendor.includes(q) || desc.includes(q) || cat.includes(q) || opp.includes(q);
    });
  }, [expenses, searchQuery]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-[#000033] text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
              <ReceiptPercentIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                Operating Expenses Ledger
              </h2>
              <p className="text-xs text-slate-300">
                Manage, review, edit, and track actual disbursements across all opportunities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setExpenseToEdit(null);
                setIsExpenseModalOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Record Expense</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Opportunity Filter */}
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vendor, description, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Opportunity Filter & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={selectedOpportunityFilter}
                onChange={(e) => setSelectedOpportunityFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Opportunities</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.name} {opp.type ? `(${opp.type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Refresh expenses"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Table Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <ArrowPathIcon className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Loading operating expenses...</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <ReceiptPercentIcon className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No Operating Expenses Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || selectedOpportunityFilter !== 'ALL'
                  ? 'No expenses matched your filter criteria.'
                  : 'No operating expenses have been recorded yet.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsExpenseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Record First Expense</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">Opportunity</th>
                    <th className="px-3.5 py-2.5">Vendor / Payee</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5 text-right">Amount</th>
                    <th className="px-3.5 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                        {exp.expense_date}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block max-w-[180px] truncate" title={exp.opportunities?.name}>
                          {exp.opportunities?.name || `Opportunity #${exp.opportunity_id || 'N/A'}`}
                        </span>
                        {exp.opportunities?.type && (
                          <span className="text-[10px] text-slate-400 block">
                            {exp.opportunities.type}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap" title={exp.description || undefined}>
                        {exp.vendor || '—'}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        {formatUSD(exp.amount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setExpenseToEdit(exp);
                              setIsExpenseModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setExpenseToDelete(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                  <tr>
                    <td colSpan={4} className="px-3.5 py-2.5 text-slate-700 uppercase">
                      Total ({filteredExpenses.length} disbursements)
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-black text-rose-700 text-sm">
                      {formatUSD(totalAmount)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="font-mono text-slate-500">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Nested Add / Edit Modal */}
        {isExpenseModalOpen && (
          <AddExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => {
              setIsExpenseModalOpen(false);
              setExpenseToEdit(null);
            }}
            opportunities={opportunities}
            opportunityId={expenseToEdit?.opportunity_id || opportunities?.[0]?.id || 9}
            expenseToEdit={expenseToEdit}
            onExpenseAdded={async () => {
              await loadExpenses();
              if (onExpenseUpdated) onExpenseUpdated();
            }}
          />
        )}

        {/* Delete Confirmation Pop Up */}
        {expenseToDelete && (
          <DeleteExpenseModal
            isOpen={!!expenseToDelete}
            expense={expenseToDelete}
            isDeleting={isDeleting}
            onClose={() => setExpenseToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  );
}
