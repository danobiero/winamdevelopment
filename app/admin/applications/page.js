import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getMembershipApplications,
  getMembershipApplicationCounts,
  getMembershipApplicationById,
  getActiveRejectionPolicies,
  getApplicationEvents, // Added this import
} from './membership-actions';

import ApplicationViewModal from './ApplicationViewModal';
import ApplicationProcessModal from './ApplicationProcessModal';
import DeleteApplicationButton from './DeleteApplicationButton';
import PaginationControls from '@/app/_components/PaginationControls';
import FilterPanel from '@/app/_components/FilterPanel';

const PAGE_SIZE = 10;

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default async function MembershipApplicationsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;
  const processId = params?.process || null;
  const targetId = viewId || processId;
  const searchApplicant = params?.searchApplicant || null;
  const feeStatus = params?.feeStatus || 'all';

  // Fetching data in parallel for performance
  const [
    allApplications,
    counts,
    targetApplication,
    rejectionPolicies,
    applicationEvents,
  ] = await Promise.all([
    // Fetch PAGE_SIZE + 1 to detect if a "next" page exists
    getMembershipApplications({
      from: (page - 1) * PAGE_SIZE,
      to: (page - 1) * PAGE_SIZE + PAGE_SIZE,
      searchApplicant,
      feeStatus,
    }),
    getMembershipApplicationCounts({ searchApplicant }),
    targetId ? getMembershipApplicationById(targetId) : null,
    // Only fetch rejection policies if we are actively processing an application
    processId ? getActiveRejectionPolicies() : [],
    // Only fetch events if we are viewing an application's timeline
    viewId ? getApplicationEvents(viewId) : [],
  ]);

  const buildQueryString = (overrides = {}) => {
    const qp = new URLSearchParams();
    const merged = {
      page,
      ...(searchApplicant ? { searchApplicant } : {}),
      ...(feeStatus && feeStatus !== 'all' ? { feeStatus } : {}),
      ...overrides,
    };

    Object.entries(merged).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '' && !(k === 'feeStatus' && v === 'all')) {
        qp.set(k, String(v));
      }
    });

    const str = qp.toString();
    return str ? `/admin/applications?${str}` : '/admin/applications';
  };

  // Logic to handle pagination and modal state
  const hasNext = allApplications.length > PAGE_SIZE;
  const applications = hasNext
    ? allApplications.slice(0, PAGE_SIZE)
    : allApplications;

  const viewedApplication = viewId ? targetApplication : null;
  const processedApplication = processId ? targetApplication : null;

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      {/* --- MODALS --- */}
      {viewedApplication && (
        <ApplicationViewModal
          application={viewedApplication}
          events={applicationEvents}
        />
      )}
      {processedApplication && (
        <ApplicationProcessModal
          application={processedApplication}
          rejectionPolicies={rejectionPolicies}
        />
      )}

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Membership <span className="text-blue-600">Applications</span>
          </h1>
          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {applications.length} Records on Page {page}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Status Key:
          </span>
          {['Applied', 'In Review', 'Approved', 'Rejected'].map((status) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className={`h-2 w-2 rounded-full ${
                  status === 'Applied'
                    ? 'bg-blue-500'
                    : status === 'In Review'
                      ? 'bg-amber-500'
                      : status === 'Approved'
                        ? 'bg-emerald-500'
                        : 'bg-red-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-600">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Fee Payment Status Filter Tabs */}
        <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
          {[
            { key: 'all', label: 'All Applications', count: counts.all },
            { key: 'unpaid', label: 'Unpaid', count: counts.unpaid },
            { key: 'paid', label: 'Paid', count: counts.paid },
          ].map((tab) => {
            const isActive = feeStatus === tab.key;
            return (
              <Link
                key={tab.key}
                href={buildQueryString({ feeStatus: tab.key, page: 1 })}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? tab.key === 'unpaid'
                      ? 'bg-red-600 text-white shadow-sm'
                      : tab.key === 'paid'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-black/15 text-white'
                      : 'bg-slate-200 text-slate-600'
                  } ${isActive && tab.key === 'all' ? '!bg-slate-100 !text-slate-700' : ''}`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <FilterPanel
        basePath="/admin/applications"
        searchLabel="Search Applicant"
        searchParamName="searchApplicant"
        placeholder="Search by applicant name or email..."
        initialSearchValue={searchApplicant || ''}
      />

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">
            No {feeStatus !== 'all' ? feeStatus : ''} membership applications found.
          </p>
          <p className="text-xs text-slate-400">
            Try adjusting your filter or search criteria.
          </p>
        </div>
      ) : (
        <>
          {/* --- MOBILE CARD VIEW --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    #{String(app.id).slice(0, 8)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {formatDate(app.created_at)}
                  </span>
                </div>
                <div className="w-full">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Applicant Info
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {app.full_name}
                    </p>
                    <a
                      href={`mailto:${app.email}`}
                      className="text-xs font-medium text-blue-600 hover:underline truncate"
                    >
                      {app.email}
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                      Status
                    </p>
                    <StatusBadge status={app.status} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                      App Fee
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded border ${
                        app.application_fee_paid
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                          : 'text-red-500 bg-slate-50 border-slate-200'
                      }`}
                    >
                      {app.application_fee_paid ? 'PAID' : 'UNPAID'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-50">
                  <Link
                    href={buildQueryString({ view: app.id })}
                    className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 border border-yellow-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    View
                  </Link>
                  {/* Check for both applied and reviewing */}
                  {(app.status === 'applied' || app.status === 'reviewing') &&
                    app.application_fee_paid && (
                      <Link
                        href={buildQueryString({ process: app.id })}
                        className="px-3 py-2 bg-green-600 hover:bg-green-700 border border-green-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                      >
                        Process
                      </Link>
                    )}
                  {!app.application_fee_paid && (
                    <DeleteApplicationButton application={app} variant="mobile" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* --- DESKTOP TABLE VIEW --- */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="min-w-[850px] w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'ID',
                    'Applicant',
                    'Phone',
                    'Fee Paid',
                    'Status',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-4 py-4 font-mono text-xs text-slate-400 font-bold truncate">
                      #{String(app.id).slice(0, 8)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">
                          {app.full_name}
                        </span>
                        <span className="text-xs text-blue-600">
                          {app.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-medium text-slate-600">
                      {app.phone}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-0.5 rounded border text-xs font-black uppercase ${
                          app.application_fee_paid
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-red-500 bg-slate-50'
                        }`}
                      >
                        {app.application_fee_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIndicator status={app.status} />
                        <StatusBadge status={app.status} />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link
                          href={buildQueryString({ view: app.id })}
                          className="bg-yellow-600 hover:bg-yellow-700 border border-yellow-700 text-white px-2 py-1 rounded text-xs font-black uppercase shadow-sm transition-colors"
                        >
                          View
                        </Link>
                        {/* Check for both applied and reviewing */}
                        {(app.status === 'applied' || app.status === 'reviewing') &&
                          app.application_fee_paid && (
                            <Link
                              href={buildQueryString({ process: app.id })}
                              className="bg-green-600 hover:bg-green-700 border border-green-700 text-white px-2 py-1 rounded text-xs font-black uppercase shadow-sm transition-colors"
                            >
                              Process
                            </Link>
                          )}
                        {!app.application_fee_paid && (
                          <DeleteApplicationButton
                            application={app}
                            variant="desktop"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="pt-2 pb-8">
        <PaginationControls page={page} hasNext={hasNext} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    applied: 'text-blue-600 bg-blue-50 border-blue-100',
    reviewing: 'text-amber-600 bg-amber-50 border-amber-100',
    approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    rejected: 'text-red-600 bg-red-50 border-red-100',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded border text-xs font-black uppercase tracking-widest ${
        styles[status?.toLowerCase()] || styles.applied
      }`}
    >
      {status || 'applied'}
    </span>
  );
}

function StatusIndicator({ status }) {
  const colors = {
    applied: 'bg-blue-500',
    reviewing: 'bg-amber-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
  };
  return (
    <div
      className={`h-2 w-2 rounded-full ${
        colors[status?.toLowerCase()] || colors.applied
      }`}
    />
  );
}
