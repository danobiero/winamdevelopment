import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getRedemptionById,
  getActiveRedemptionRejectionPolicies,
} from '../redemption-actions';

import RedemptionStatusForm from './RedemptionStatusForm';

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value ?? 0);

export default async function RedemptionEditPage({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const { id: redemptionId } = await params;
  const redemption = await getRedemptionById(redemptionId);

  if (!redemption) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-red-600">
          Redemption Not Found
        </h1>
        <Link
          href="/admin/redemptions"
          className="text-blue-600 hover:underline mt-4 block"
        >
          ← Back to Redemptions
        </Link>
      </div>
    );
  }

  const rejectionPolicies = await getActiveRedemptionRejectionPolicies();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Edit <span className="text-blue-600">Redemption</span>{' '}
          <span className="text-gray-400 font-mono text-xl">
            #{String(redemption.id).slice(0, 8)}
          </span>
        </h1>
        <Link
          href="/admin/redemptions"
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Redemptions
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Redemption Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold border-b pb-2 flex justify-between items-center">
            <span>Redemption Information</span>
            {/* ADDED: Current Status Badge */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                redemption.status === 'approved'
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : redemption.status === 'completed'
                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : redemption.status === 'rejected'
                      ? 'bg-red-50 text-red-600 border border-red-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}
            >
              {redemption.status || 'pending'}
            </span>
          </h2>
          <div className="space-y-3 text-sm">
            {/* ADDED: Request Date */}
            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Requested On:</span>
              <span className="font-medium text-gray-700">
                {new Date(redemption.created_at).toLocaleDateString()}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Investment ID:</span>
              <span className="font-mono">#{redemption.investment_id}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Shareholder:</span>
              <span className="font-semibold">
                {redemption.shareholders?.fullName}
              </span>
            </p>
            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Amount:</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(redemption.amount, redemption.currency)}
              </span>
            </p>
            <div>
              {/* UPDATED: Clarified Admin Notes */}
              <span className="text-gray-500 font-medium block mb-1">
                Admin Notes:
              </span>
              <div className="bg-gray-50 p-3 rounded italic text-gray-700 border">
                {redemption.admin_notes || 'No internal notes provided.'}
              </div>
            </div>
          </div>
        </div>

        {/* MANAGEMENT CARD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Management</h2>
          <RedemptionStatusForm
            redemption={redemption}
            rejectionPolicies={rejectionPolicies}
          />
        </div>
      </div>

      {/* Investment Summary */}
      <div className="bg-gray-50 p-6 rounded-xl border border-dashed">
        <h2 className="text-lg font-bold mb-4">Linked Investment</h2>
        {redemption.investments ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <span className="text-xs uppercase text-gray-400">
                Opportunity ID
              </span>
              <div className="font-mono mt-1">
                #{redemption.investments.opportunity_id}
              </div>
            </div>
            <div className="bg-white p-3 rounded border">
              <span className="text-xs uppercase text-gray-400">
                Total Committed
              </span>
              <div className="font-semibold mt-1">
                {/* FIXED: Added currency variable to formatter */}
                {formatCurrency(
                  redemption.investments.total_committed,
                  redemption.currency
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="italic text-gray-500">No investment data linked.</p>
        )}
      </div>
    </div>
  );
}
