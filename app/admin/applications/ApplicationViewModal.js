'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value ?? 0);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ApplicationViewModal({ application, events = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // NEW: State for managing tabs
  const [activeTab, setActiveTab] = useState('details');

  if (!application) return null;

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const handleProcess = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    params.set('process', application.id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const canProcess =
    (application.status === 'applied' || application.status === 'reviewing') &&
    application.application_fee_paid;

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="bg-gray-50 pt-4 border-b shrink-0">
          <div className="px-4 sm:px-6 flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Application Details
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-4 sm:px-6 gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Timeline
              {events.length > 0 && (
                <span className="bg-gray-100 text-gray-500 py-0.5 px-2 rounded-full text-xs">
                  {events.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {activeTab === 'details' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Top Section: ID & Status */}
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Application ID
                  </p>
                  <p className="font-mono text-sm text-gray-700">
                    #{String(application.id).slice(0, 8)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    application.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : application.status === 'rejected'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : application.status === 'reviewing'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}
                >
                  {application.status || 'applied'}
                </span>
              </div>

              {/* Applicant Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Applicant Name
                  </p>
                  <p className="font-bold text-gray-900 text-base">
                    {application.full_name}
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Contact Info
                  </p>
                  <p className="text-sm text-blue-600 font-medium hover:underline">
                    <a href={`mailto:${application.email}`}>
                      {application.email}
                    </a>
                  </p>
                  <p className="text-sm text-gray-600">{application.phone}</p>
                </div>
              </div>

              {/* Agreements & Fees */}
              <div className="bg-slate-50 border rounded-xl p-4 grid grid-cols-2 gap-y-4 gap-x-2">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Application Fee
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-widest ${application.application_fee_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                  >
                    {application.application_fee_paid ? 'PAID' : 'UNPAID'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Current Shareholding
                  </p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">
                    {formatCurrency(application.current_shareholding_value)}
                  </p>
                </div>
                <div className="col-span-2 border-t pt-3 mt-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Agreements
                  </p>
                  <div className="flex flex-col gap-1.5 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${application.has_agreed_to_shareholding ? 'bg-emerald-500' : 'bg-red-400'}`}
                      />{' '}
                      Agreed to Shareholding terms
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${application.has_agreed_to_operating_agreement ? 'bg-emerald-500' : 'bg-red-400'}`}
                      />{' '}
                      Agreed to Operating Agreement
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${application.operating_agreement_signed ? 'bg-emerald-500' : 'bg-red-400'}`}
                      />{' '}
                      Signed Operating Agreement{' '}
                      {application.agreement_signed_at && (
                        <span className="text-gray-400">
                          (
                          {new Date(
                            application.agreement_signed_at
                          ).toLocaleDateString()}
                          )
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interests & Experience */}
              <div className="space-y-4 border-t pt-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Primary Interest
                  </p>
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {application.primary_interest || 'None specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Experience Description
                  </p>
                  <div className="mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap">
                    {application.experience_description ||
                      'No experience description provided.'}
                  </div>
                </div>
              </div>

              {/* Decision Result */}
              {application.status !== 'applied' &&
                application.decision_result && (
                  <div
                    className={`mt-2 border rounded-xl p-4 ${application.status === 'rejected' ? 'bg-red-50/50 border-red-100' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-widest ${application.status === 'rejected' ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      {application.status === 'rejected'
                        ? 'Rejection Reason'
                        : 'Admin Decision Notes'}
                    </p>
                    <p
                      className={`text-sm font-semibold mt-1 ${application.status === 'rejected' ? 'text-red-700' : 'text-gray-800'}`}
                    >
                      {application.decision_result}
                    </p>
                  </div>
                )}

              <div className="pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Submitted Date
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(application.created_at)}
                </p>
              </div>
            </div>
          ) : (
            // TIMELINE TAB CONTENT
            <div className="animate-in fade-in slide-in-from-left-2 duration-200">
              {events.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-sm font-medium text-gray-500">
                    No processing history found.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Events will appear here once the application is processed.
                  </p>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
                  {events.map((event, index) => (
                    <div key={event.id || index} className="relative pl-6">
                      {/* Timeline Dot */}
                      <div
                        className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                          event.new_status === 'approved'
                            ? 'bg-emerald-500'
                            : event.new_status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                        }`}
                      />

                      {/* Event Details */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {formatDate(event.created_at)}
                        </p>
                        <div className="mt-1">
                          <p className="text-sm font-bold text-gray-900">
                            Status changed to{' '}
                            <span className="capitalize">
                              {event.new_status}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Previously:{' '}
                            <span className="capitalize">
                              {event.previous_status}
                            </span>
                          </p>
                        </div>

                        {event.decision_result && (
                          <div
                            className={`mt-2 p-3 rounded-lg border text-sm ${
                              event.new_status === 'rejected'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}
                          >
                            <p className="font-semibold">
                              {event.decision_result}
                            </p>
                          </div>
                        )}

                        {event.admin_id && (
                          <p className="text-xs font-medium text-gray-400 mt-2">
                            Processed by Admin:{' '}
                            {String(event.admin_id).slice(0, 8)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Initial Submission Event (Inferred) */}
                  <div className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-gray-300" />
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {formatDate(application.created_at)}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        Application Submitted
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t shrink-0">
          {canProcess && activeTab === 'details' ? (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98]"
              >
                CLOSE
              </button>
              <button
                onClick={handleProcess}
                className="flex-1 bg-green-600 border border-green-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all active:scale-[0.98] shadow-sm"
              >
                PROCESS
              </button>
            </div>
          ) : (
            <button
              onClick={handleClose}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              CLOSE
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
