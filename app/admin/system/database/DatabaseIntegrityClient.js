'use client';

import { useState } from 'react';
import {
  CircleStackIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ArrowPathIcon,
  LinkIcon,
  CheckCircleIcon,
  XMarkIcon,
  CommandLineIcon,
  InformationCircleIcon,
  ServerStackIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import {
  purgeOrphanedRecord,
  reassignOrphanedRecord,
  bulkPurgeOrphans,
  getDatabaseIntegrityReport,
  resetLegacyRecordStatus,
} from './actions';
import toast from 'react-hot-toast';

export default function DatabaseIntegrityClient({ initialReport }) {
  const [report, setReport] = useState(initialReport);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedRows, setSelectedRows] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Reassign Modal State
  const [reassignModalItem, setReassignModalItem] = useState(null);
  const [targetShareholderId, setTargetShareholderId] = useState('');
  const [targetOpportunityId, setTargetOpportunityId] = useState('');

  // Confirmation Purge Modal State
  const [confirmPurgeItem, setConfirmPurgeItem] = useState(null);
  const [confirmBulkPurgeTable, setConfirmBulkPurgeTable] = useState(null);

  const { metrics, tables, shareholdersList } = report;

  // Refresh report
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const updated = await getDatabaseIntegrityReport();
      setReport(updated);
      setSelectedRows({});
      toast.success('Database integrity audit refreshed');
    } catch (err) {
      toast.error('Failed to refresh audit: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compile all anomalies
  const allAnomalies = [
    ...tables.payments.items,
    ...tables.redemptions.items,
    ...tables.investments.items,
    ...tables.redemptionRequests.items,
    ...tables.applications.items,
    ...(tables.legacyShareholders?.items || []),
  ];

  // Current tab items
  const currentItems =
    selectedTab === 'all'
      ? allAnomalies
      : selectedTab === 'payments'
      ? tables.payments.items
      : selectedTab === 'redemptions'
      ? tables.redemptions.items
      : selectedTab === 'investments'
      ? tables.investments.items
      : selectedTab === 'legacy'
      ? tables.legacyShareholders?.items || []
      : [];

  // Single purge
  const handleExecutePurge = async (item) => {
    setIsProcessing(true);
    try {
      await purgeOrphanedRecord({ table: item.table, id: item.id });
      toast.success(`Purged orphaned ${item.table} record`);
      setConfirmPurgeItem(null);
      await handleRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk purge
  const handleExecuteBulkPurge = async (table) => {
    const idsToPurge = tables[table]?.items.map((i) => i.id) || [];

    if (idsToPurge.length === 0) {
      toast.error('No records selected for purge.');
      return;
    }

    setIsProcessing(true);
    try {
      await bulkPurgeOrphans({ table, ids: idsToPurge });
      toast.success(`Purged ${idsToPurge.length} records from ${table}`);
      setConfirmBulkPurgeTable(null);
      await handleRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset legacy record status
  const handleExecuteResetLegacy = async (id) => {
    setIsProcessing(true);
    try {
      const res = await resetLegacyRecordStatus(id);
      toast.success(res.message);
      await handleRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reassign record
  const handleExecuteReassign = async (e) => {
    e.preventDefault();
    if (!targetShareholderId) {
      toast.error('Please select a shareholder');
      return;
    }

    setIsProcessing(true);
    try {
      await reassignOrphanedRecord({
        table: reassignModalItem.table,
        id: reassignModalItem.id,
        shareholderId: targetShareholderId,
        opportunityId: targetOpportunityId || undefined,
      });
      toast.success('Record reconciled and attached to shareholder!');
      setReassignModalItem(null);
      setTargetShareholderId('');
      setTargetOpportunityId('');
      await handleRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Integrity Score */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Integrity Score
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                metrics.integrityScore >= 98
                  ? 'bg-emerald-100 text-emerald-800'
                  : metrics.integrityScore >= 90
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {metrics.integrityScore >= 98 ? 'Optimal' : 'Needs Action'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
              {metrics.integrityScore}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Consistency</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.integrityScore >= 98
                  ? 'bg-emerald-500'
                  : metrics.integrityScore >= 90
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${metrics.integrityScore}%` }}
            />
          </div>
        </div>

        {/* Orphaned Entities */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Unlinked / Orphaned Entries
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono ${
                metrics.totalOrphans === 0
                  ? 'text-emerald-600'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {metrics.totalOrphans}
            </span>
            <span className="text-xs text-slate-400 font-medium">Anomalies Detected</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Includes payments, redemptions & legacy ghost entries
          </p>
        </div>

        {/* Verified Healthy Records */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Verified Healthy Records
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.healthyRecords}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              of {metrics.totalAuditRecords}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Properly linked across ledger & equity
          </p>
        </div>

        {/* Registry Scope */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Active Registry
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
              {metrics.shareholdersCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">Shareholders</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {metrics.legacyCount} Staged Legacy Records
          </p>
        </div>
      </div>

      {/* ACTION & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedTab === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Anomalies</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900">
              {allAnomalies.length}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('legacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedTab === 'legacy'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserGroupIcon className="h-3.5 w-3.5" />
            <span>Legacy Registry</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-purple-700 text-white">
              {tables.legacyShareholders?.orphans || 0}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('payments')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedTab === 'payments'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Orphaned Payments</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-blue-700 text-white">
              {tables.payments.orphans}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('redemptions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedTab === 'redemptions'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Orphaned Redemptions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-red-700 text-white">
              {tables.redemptions.orphans}
            </span>
          </button>

          <button
            onClick={() => setSelectedTab('guide')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedTab === 'guide'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <InformationCircleIcon className="h-3.5 w-3.5" />
            <span>Architecture Guide</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Re-Audit Database</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEW: ANOMALIES TABLE OR RECONCILIATION GUIDE */}
      {selectedTab === 'guide' ? (
        /* RECONCILIATION & INTEGRITY ARCHITECTURAL GUIDE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <ServerStackIcon className="h-6 w-6 text-purple-600" />
              <span>Enterprise Data Reconciliation & Foreign Key Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Best-practice strategy for ensuring complete referential integrity, zero orphaned records, and permanent tracking logic across live and staging records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <span className="font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                1. Dual Resolution at Ingestion
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Every payment and payout webhook, form, or script must resolve the exact <code>shareholder_id</code> <em>before</em> database insertion.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-2">
              <span className="font-black text-purple-900 dark:text-purple-300 uppercase tracking-wider block">
                2. Legacy Staging Synchronization
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                When a live shareholder is deleted from <code>shareholders</code>, any linked staging record in <code>legacy_shareholders</code> can either be purged or reset back to &quot;Awaiting Sign-In&quot;.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <span className="font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider block">
                3. PostgreSQL Foreign Key Constraints
              </span>
              <p className="text-slate-600 dark:text-slate-300">
                Once existing orphaned test records are cleared using this console, strict <code>REFERENCES shareholders(id) ON DELETE RESTRICT</code> constraints prevent deletion of shareholders with active investments.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ANOMALIES TABLE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Detected Data Anomalies ({currentItems.length})
              </h3>
              {currentItems.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Needs Action
                </span>
              )}
            </div>

            {/* Bulk Purge Button for Current Table */}
            {selectedTab !== 'all' && currentItems.length > 0 && (
              <button
                onClick={() => setConfirmBulkPurgeTable(selectedTab === 'legacy' ? 'legacy_shareholders' : selectedTab)}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Bulk Purge All {selectedTab}</span>
              </button>
            )}
          </div>

          {currentItems.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">
                No Orphaned or Non-Matching Records in this View!
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Every record in this category has a valid, existing foreign key pointing directly to an active shareholder profile.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Entity & ID</th>
                    <th className="py-3 px-4">Issue Diagnosis</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Metadata & Reference Hints</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {currentItems.map((item) => {
                    const meta = item.metadata || {};
                    const hintEmail = meta.email || '';
                    const hintName =
                      meta.full_name ||
                      meta.recipient_name ||
                      meta.memo ||
                      meta.reference_number ||
                      '';

                    return (
                      <tr
                        key={`${item.table}_${item.id}`}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Entity & ID */}
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-2 ${
                              item.table === 'payments'
                                ? 'bg-blue-100 text-blue-800'
                                : item.table === 'redemptions'
                                ? 'bg-red-100 text-red-800'
                                : item.table === 'legacy_shareholders'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.table === 'legacy_shareholders' ? 'LEGACY' : item.table}
                          </span>
                          <span
                            className="text-slate-900 dark:text-slate-200 font-bold block mt-1 truncate max-w-[180px]"
                            title={item.id}
                          >
                            #{item.id}
                          </span>
                        </td>

                        {/* Issue Diagnosis */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold text-xs">
                            <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
                            {item.reason}
                          </span>
                          {item.description && (
                            <span
                              className="block text-[11px] text-slate-400 truncate max-w-[260px]"
                              title={item.description}
                            >
                              {item.description}
                            </span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-xs">
                          {item.amount != null ? (
                            <span
                              className={
                                item.amount < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }
                            >
                              ${Math.abs(Number(item.amount)).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                          <span className="block text-[10px] text-slate-400 font-normal uppercase">
                            {item.type}
                          </span>
                        </td>

                        {/* Metadata & Hints */}
                        <td className="py-3.5 px-4">
                          {hintName || hintEmail ? (
                            <div className="space-y-0.5">
                              {hintName && (
                                <span
                                  className="block font-bold text-slate-700 dark:text-slate-300 truncate max-w-[220px]"
                                  title={hintName}
                                >
                                  👤 {hintName}
                                </span>
                              )}
                              {hintEmail && (
                                <span
                                  className="block text-slate-500 font-mono text-[11px] truncate max-w-[220px]"
                                  title={hintEmail}
                                >
                                  ✉️ {hintEmail}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              No metadata hints
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* If legacy ghost record, offer Reset button */}
                            {item.table === 'legacy_shareholders' && item.canReset && (
                              <button
                                onClick={() => handleExecuteResetLegacy(item.id)}
                                disabled={isProcessing}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Reset status to 'Awaiting Sign-In' so shareholder can claim upon sign-in"
                              >
                                <ArrowPathIcon className="h-3 w-3" />
                                <span>Reset Status</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setReassignModalItem(item);
                                setTargetOpportunityId(item.opportunity_id || '');
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Reconcile and link to an existing shareholder"
                            >
                              <LinkIcon className="h-3 w-3" />
                              <span>Reassign</span>
                            </button>

                            <button
                              onClick={() => setConfirmPurgeItem(item)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Purge orphaned / test record"
                            >
                              <TrashIcon className="h-3 w-3" />
                              <span>Purge</span>
                            </button>
                          </div>
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

      {/* REASSIGN MODAL */}
      {reassignModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-blue-600" />
                <span>Reassign & Reconcile Record</span>
              </h3>
              <button
                onClick={() => setReassignModalItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
              <span className="font-mono text-[11px] text-slate-400 uppercase block">
                Table: {reassignModalItem.table}
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Record #{reassignModalItem.id}
              </p>
              {reassignModalItem.description && (
                <p className="text-slate-500 italic text-[11px]">
                  {reassignModalItem.description}
                </p>
              )}
            </div>

            <form onSubmit={handleExecuteReassign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Target Shareholder Profile
                </label>
                <select
                  value={targetShareholderId}
                  onChange={(e) => setTargetShareholderId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">Select a shareholder to link...</option>
                  {shareholdersList.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      #{sh.id} - {sh.name} ({sh.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignModalItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Linking...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM PURGE SINGLE ITEM MODAL */}
      {confirmPurgeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <TrashIcon className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Purge Non-Matching Record?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permanently deletes record #{confirmPurgeItem.id} from <strong>{confirmPurgeItem.table}</strong>. This action is irreversible.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmPurgeItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecutePurge(confirmPurgeItem)}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Purging...' : 'Yes, Purge Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM BULK PURGE MODAL */}
      {confirmBulkPurgeTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <TrashIcon className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Purge All {confirmBulkPurgeTable}?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to purge all non-matching records in <strong>{confirmBulkPurgeTable}</strong>?
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmBulkPurgeTable(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteBulkPurge(confirmBulkPurgeTable)}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Purging...' : 'Purge All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
