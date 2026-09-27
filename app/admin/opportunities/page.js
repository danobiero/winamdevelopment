import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FormatCurrency } from '@/app/_lib/utils';

import AdminDeleteOpportunity from './_components/AdminDeleteOpportunity';
import AdminToggleStatus from './_components/AdminToggleStatus';
import {
  checkOpportunityHasInvestments,
  deleteOpportunityAction,
  getOpportunityById,
  getOpportunities,
} from './actions';
import ViewModal from './ViewModal';
import {
  PlusIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import ToastListener from './ToastListener';
import Tooltip from '../calendar/_components/Tooltip';
import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

export default async function OpportunitiesPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let viewedOpportunity = null;
  if (viewId) {
    viewedOpportunity = await getOpportunityById(viewId);
  }

  const opportunities = await getOpportunities({ from, to });

  for (const opportunity of opportunities) {
    const result = await checkOpportunityHasInvestments(opportunity.id);
    opportunity.hasInvestments = result.hasInvestments;
    opportunity.investmentCount = result.count;
  }

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      <ToastListener />
      {viewedOpportunity && (
        <ViewModal
          opportunity={viewedOpportunity.opportunity}
          documents={viewedOpportunity.documents} // Assuming you still use materials/documents
        />
      )}

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Opportunities <span className="text-blue-600">Catalog</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            Displaying {opportunities.length} Results
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip text={'Create a new opportunity'}>
            <Link
              href="/admin/opportunities/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-sm active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create</span>
            </Link>
          </Tooltip>

          <Tooltip text={'Upload opportunity documents'}>
            <Link
              href="/admin/opportunities/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-sm active:scale-95"
            >
              <DocumentArrowUpIcon className="h-4 w-4" />
              <span>Documents</span>
            </Link>
          </Tooltip>

          <Tooltip text={'Manage opportunity images'}>
            <Link
              href="/admin/opportunities/uploadImage"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition shadow-sm active:scale-95"
            >
              <PhotoIcon className="h-4 w-4" />
              <span>Images</span>
            </Link>
          </Tooltip>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className={`bg-white rounded-2xl border p-5 flex flex-col space-y-4 shadow-sm transition-colors ${
              opportunity.status !== 'active'
                ? 'border-amber-200 bg-amber-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                ID: {opportunity.id}
              </span>
              <span className="text-sm font-black text-blue-600">
                Min: {FormatCurrency(opportunity.minimum_investment)}
              </span>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Opportunity Name
              </p>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {opportunity.name}
              </h3>
              {opportunity.status !== 'active' && (
                <span className="inline-block mt-1 text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  {opportunity.status}
                </span>
              )}
            </div>

            <div className="w-full pt-2 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Investments
                </p>
                <span className="text-xs font-bold text-slate-600">
                  {opportunity.investmentCount} Commitments
                </span>
              </div>
              <AdminToggleStatus
                opportunityId={opportunity.id}
                currentStatus={opportunity.status}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-50">
              <Link
                href={`/admin/opportunities?view=${opportunity.id}&page=${page}`}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                View
              </Link>
              <Link
                href={`/admin/opportunities/${opportunity.id}`}
                className="px-3 py-2 bg-white border border-slate-200 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                Edit
              </Link>
              <div className="ml-auto">
                {!opportunity.hasInvestments ? (
                  <AdminDeleteOpportunity
                    opportunityId={opportunity.id}
                    opportunityName={opportunity.name}
                    onDelete={deleteOpportunityAction}
                  />
                ) : (
                  <div className="px-2 py-1 text-[9px] font-black text-slate-300 border border-slate-100 rounded uppercase tracking-tighter">
                    Locked
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="min-w-[850px] w-full text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-24 px-6 py-4 font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">
                Name
              </th>
              <th className="w-32 px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center">
                Min Inv.
              </th>
              <th className="w-64 px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opportunity) => (
              <tr
                key={opportunity.id}
                className={`hover:bg-blue-50/30 transition-colors group ${
                  opportunity.status !== 'active' ? 'bg-amber-50/10' : ''
                }`}
              >
                <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold truncate">
                  #{opportunity.id}
                </td>
                <td className="px-6 py-4 font-bold text-slate-900 truncate">
                  {opportunity.name}
                </td>
                <td className="px-6 py-4 text-center font-black text-slate-900">
                  {FormatCurrency(opportunity.minimum_investment)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <AdminToggleStatus
                      opportunityId={opportunity.id}
                      currentStatus={opportunity.status}
                    />
                    <Link
                      href={`/admin/opportunities?view=${opportunity.id}&page=${page}`}
                      className="text-blue-600 font-black uppercase text-[10px] hover:underline"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/opportunities/${opportunity.id}`}
                      className="text-emerald-600 font-black uppercase text-[10px] hover:underline"
                    >
                      Edit
                    </Link>
                    {!opportunity.hasInvestments ? (
                      <AdminDeleteOpportunity
                        opportunityId={opportunity.id}
                        opportunityName={opportunity.name}
                        onDelete={deleteOpportunityAction}
                      />
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase">
                        Locked
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 pb-8">
        <PaginationControls
          page={page}
          hasNext={opportunities.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}
