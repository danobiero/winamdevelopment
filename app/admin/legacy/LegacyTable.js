'use client';

import { useState, useTransition } from 'react';
import { deleteLegacyShareholder } from '@/app/_lib/actions';
import { FormatCurrency } from '@/app/_lib/utils';
import EditLegacyModal from './EditLegacyModal';
import {
  CheckBadgeIcon,
  ClockIcon,
  TrashIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UserIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

function getAllocations(r, opportunities = []) {
  let invList = r.investments;
  if (typeof invList === 'string') {
    try {
      invList = JSON.parse(invList);
    } catch (e) {}
  }

  if (Array.isArray(invList) && invList.length > 0) {
    return invList.map((inv) => {
      const opp = opportunities.find((o) => String(o.id) === String(inv.opportunity_id));
      return {
        opportunityId: inv.opportunity_id,
        opportunityName: opp
          ? opp.name
          : r.opportunities?.id === inv.opportunity_id
          ? r.opportunities.name
          : `Opportunity #${inv.opportunity_id}`,
        opportunityType: opp?.type || r.opportunities?.type,
        amount: Number(inv.amount_invested) || 0,
        startDate: inv.start_date,
      };
    });
  }

  // Linked live investments fallback from shareholders table
  if (Array.isArray(r.shareholders?.investments) && r.shareholders.investments.length > 0) {
    return r.shareholders.investments.map((inv) => {
      const opp = opportunities.find((o) => String(o.id) === String(inv.opportunity_id)) || inv.opportunities;
      return {
        opportunityId: inv.opportunity_id,
        opportunityName: opp?.name || `Opportunity #${inv.opportunity_id}`,
        opportunityType: opp?.type,
        amount: Number(inv.amount_invested) || 0,
        startDate: inv.start_date,
      };
    });
  }

  if (r.notes && r.notes.includes('[Allocations JSON]:')) {
    try {
      const parsed = JSON.parse(r.notes.split('[Allocations JSON]:')[1]?.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((inv) => {
          const opp = opportunities.find((o) => String(o.id) === String(inv.opportunity_id));
          return {
            opportunityId: inv.opportunity_id,
            opportunityName: opp
              ? opp.name
              : r.opportunities?.id === inv.opportunity_id
              ? r.opportunities.name
              : `Opportunity #${inv.opportunity_id}`,
            opportunityType: opp?.type || r.opportunities?.type,
            amount: Number(inv.amount_invested) || 0,
            startDate: inv.start_date,
          };
        });
      }
    } catch (e) {}
  }

  if (r.opportunity_id) {
    const opp = opportunities.find((o) => String(o.id) === String(r.opportunity_id));
    return [
      {
        opportunityId: r.opportunity_id,
        opportunityName: opp ? opp.name : (r.opportunities?.name || `Opportunity #${r.opportunity_id}`),
        opportunityType: opp?.type || r.opportunities?.type,
        amount: Number(r.amount_invested) || 0,
        startDate: r.start_date,
      },
    ];
  }

  return [];
}

export default function LegacyTable({
  records = [],
  opportunities = [],
  showHeader = true,
}) {
  const [isPending, startTransition] = useTransition();
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingAllocations, setEditingAllocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenEdit = (record, allocations) => {
    setEditingRecord(record);
    setEditingAllocations(allocations);
  };

  const handleCloseEdit = () => {
    setEditingRecord(null);
    setEditingAllocations([]);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete legacy record for "${name}"?`)) {
      startTransition(async () => {
        await deleteLegacyShareholder(id);
      });
    }
  };

  const filteredRecords = (records || []).filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.telephone?.toLowerCase().includes(term) ||
      r.nationality?.toLowerCase().includes(term)
    );
  });

  if (!records || records.length === 0) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <UserIcon className="h-6 w-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">
          No Legacy Shareholders in Staging
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Use the form above to pre-load legacy shareholder profiles, past investments, and payout preferences.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      {showHeader && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-[#000033] uppercase tracking-wider">
              Staged Legacy Shareholders ({records.length})
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Pre-platform records waiting for or already linked to Google sign-in
            </p>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-xs flex items-center gap-3">
        <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 ml-1 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search staged shareholders by name, email, phone..."
          className="w-full text-xs font-medium text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs font-medium">
          No staged shareholders match &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <>
          {/* MOBILE CARD VIEW (<lg) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {filteredRecords.map((r) => {
          const allocations = getAllocations(r, opportunities);
          const totalAmount =
            allocations.length > 0
              ? allocations.reduce((sum, a) => sum + a.amount, 0)
              : Number(r.amount_invested || 0);

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-3.5"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {r.full_name}
                  </h4>
                  <p className="text-slate-400 font-mono text-xs truncate">
                    {r.email}
                  </p>
                  {r.telephone && (
                    <p className="text-slate-400 text-xs mt-0.5">
                      Tel: {r.telephone}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r, allocations)}
                    title="Edit / Add Opportunities"
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id, r.full_name)}
                    disabled={isPending}
                    title="Delete Staging Record"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Portfolio Allocations & Total */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Allocated Opportunities ({allocations.length})
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    Total: {FormatCurrency(totalAmount)}
                  </span>
                </div>

                {allocations.length === 0 ? (
                  <div className="p-2.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                    <span className="text-slate-500 text-xs font-medium">
                      Membership Only (No Direct Investment)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    {allocations.map((alloc, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-start text-xs border-b border-slate-200/50 pb-1.5 last:border-none last:pb-0"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800 block truncate">
                            {alloc.opportunityName}
                          </span>
                          {alloc.startDate && (
                            <span className="text-xs text-slate-400 block">
                              Date: {alloc.startDate}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-xs shrink-0">
                          {FormatCurrency(alloc.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-50">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                    Payout Rail
                  </span>
                  {r.payment_type && r.payment_type !== 'none' ? (
                    <div className="min-w-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                        {r.payment_type}
                      </span>
                      {r.account_handle && (
                        <span className="block text-xs text-slate-400 mt-0.5 truncate">
                          {r.account_handle}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </div>

                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-0.5">
                    Status
                  </span>
                  {r.is_claimed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckBadgeIcon className="h-3 w-3 text-emerald-600" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      <ClockIcon className="h-3 w-3 text-amber-500" />
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (lg:block) */}
      <div className="hidden lg:block bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-x-auto border-b-4 border-b-slate-100">
        <table className="min-w-full w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">
              <th className="w-[23%] py-3.5 px-4">Shareholder</th>
              <th className="w-[37%] py-3.5 px-4">Target Portfolio</th>
              <th className="w-[14%] py-3.5 px-4">Invested Amount</th>
              <th className="w-[11%] py-3.5 px-4">Payout Rail</th>
              <th className="w-[11%] py-3.5 px-4">Sync Status</th>
              <th className="w-[8%] py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
            {filteredRecords.map((r) => {
              const allocations = getAllocations(r, opportunities);
              const totalAmount =
                allocations.length > 0
                  ? allocations.reduce((sum, a) => sum + a.amount, 0)
                  : Number(r.amount_invested || 0);

              return (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {/* Shareholder Info */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-slate-900 text-sm truncate" title={r.full_name}>
                      {r.full_name}
                    </div>
                    <div className="text-slate-400 font-mono text-xs mt-0.5 truncate" title={r.email}>
                      {r.email}
                    </div>
                    {r.telephone && (
                      <div className="text-slate-400 text-xs mt-0.5">
                        Tel: {r.telephone}
                      </div>
                    )}
                  </td>

                  {/* Allocated Opportunities */}
                  <td className="py-4 px-4 align-top">
                    {allocations.length === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600">
                        Membership Only
                      </span>
                    ) : (
                      <div className="space-y-1.5">
                        {allocations.map((alloc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 p-2 bg-slate-50/80 border border-slate-100 rounded-xl"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-slate-800 block text-xs truncate" title={alloc.opportunityName}>
                                {alloc.opportunityName}
                              </span>
                              {alloc.startDate && (
                                <span className="text-xs text-slate-400 block">
                                  Start: {alloc.startDate}
                                </span>
                              )}
                            </div>
                            <span className="font-mono font-bold text-slate-800 shrink-0 text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-xs">
                              {FormatCurrency(alloc.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Investment Amount */}
                  <td className="py-4 px-4 align-top whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      {FormatCurrency(totalAmount)}
                    </div>
                    {allocations.length > 1 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                        {allocations.length} Allocations
                      </span>
                    )}
                  </td>

                  {/* Payout Rail */}
                  <td className="py-4 px-4 align-top">
                    {r.payment_type && r.payment_type !== 'none' ? (
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                          {r.payment_type}
                        </span>
                        {r.account_handle && (
                          <span className="block text-xs text-slate-400 mt-0.5 truncate max-w-[120px]" title={r.account_handle}>
                            {r.account_handle}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Sync Status */}
                  <td className="py-4 px-4 align-top whitespace-nowrap">
                    {r.is_claimed ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckBadgeIcon className="h-3.5 w-3.5 text-emerald-600" />
                          Claimed & Live
                        </span>
                        {r.claimed_by_shareholder_id && (
                          <span className="block text-xs text-slate-400">
                            Shareholder #{r.claimed_by_shareholder_id}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                        <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                        Awaiting Sign-In
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(r, allocations)}
                        title="Edit / Add Opportunities"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id, r.full_name)}
                        disabled={isPending}
                        title="Delete Staging Record"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
        </>
      )}

      {/* Edit / Add Opportunity Modal */}
      {editingRecord && (
        <EditLegacyModal
          record={editingRecord}
          opportunities={opportunities}
          initialAllocations={editingAllocations}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
}

