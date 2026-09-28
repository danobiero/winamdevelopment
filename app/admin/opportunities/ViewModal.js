'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { FormatCurrency } from '@/app/_lib/utils';

export default function ViewModal({ opportunity, documents = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFull, setShowFull] = useState(false);

  if (!opportunity) return null;

  // Since analysis is an array of text in your schema, we join it into a single readable string
  const analysisText = opportunity.analysis?.length
    ? opportunity.analysis.join('\n\n')
    : 'No analysis provided';

  const handleClose = () => {
    // Keep the current page number when closing the modal
    const page = searchParams.get('page') || '1';
    router.push(`/admin/opportunities?page=${page}`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Container: Full screen on mobile, max-h-[90vh] ensures scrolling on desktop */}
      <div className="bg-white w-full max-h-[92vh] sm:max-w-xl rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {opportunity.name}
            </h2>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              ID: #{opportunity.id}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* CONTENT (This section will now scroll if it gets too tall) */}
        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Type
              </p>
              <p className="text-sm font-bold text-slate-700 capitalize">
                {opportunity.type || 'N/A'}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Duration
              </p>
              <p className="text-sm font-bold text-slate-700">
                {opportunity.duration_months
                  ? `${opportunity.duration_months} Months`
                  : 'TBD'}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Min. Investment
              </p>
              <p className="text-sm font-bold text-slate-700">
                {FormatCurrency(opportunity.minimum_investment)}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase">
                Expected Return
              </p>
              <p className="text-sm font-bold text-slate-700">
                {opportunity.expected_return
                  ? `${opportunity.expected_return}%`
                  : 'Variable'}
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {opportunity.description || 'No description provided.'}
            </p>
          </div>

          {/* ANALYSIS */}
          <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
              Opportunity Analysis
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {showFull
                ? analysisText
                : analysisText.length > 150
                  ? analysisText.slice(0, 150) + '...'
                  : analysisText}
            </p>

            {analysisText.length > 150 && (
              <button
                onClick={() => setShowFull(!showFull)}
                className="text-blue-600 font-bold text-xs mt-3 flex items-center gap-1 hover:underline"
              >
                {showFull ? 'Show Less' : 'View Full Analysis'}
              </button>
            )}
          </div>

          {/* DOCUMENTS LIST */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Associated Documents
            </h3>
            {documents.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-slate-400 text-sm font-medium">
                  No documents uploaded.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col min-w-0">
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={doc.file_url}
                        className="text-sm font-bold text-slate-800 hover:text-blue-600 truncate flex items-center gap-2"
                      >
                        {doc.name}
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      </a>
                      <span className="text-xs font-medium text-slate-400">
                        Added {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/30">
          <button
            onClick={() =>
              router.push(`/admin/opportunities/${opportunity.id}`)
            }
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <PencilSquareIcon className="h-5 w-5" />
            Edit Opportunity Details
          </button>
        </div>
      </div>
    </div>
  );
}
