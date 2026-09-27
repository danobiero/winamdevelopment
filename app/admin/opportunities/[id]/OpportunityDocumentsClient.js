'use client';

import { useState } from 'react';
import UploadDocuments from '../UploadDocuments';
import DocumentsList from '../_components/DocumentsList';
import { PlusIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export default function OpportunityDocumentsClient({
  initialDocuments = [],
  opportunity,
}) {
  const [documents, setDocuments] = useState(initialDocuments || []);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Called when upload succeeds
  const handleDocumentAdded = (newDocument) => {
    setDocuments((prev) => [newDocument, ...prev]);
    setIsUploadModalOpen(false);
  };

  // Called when delete succeeds
  const handleDocumentDeleted = (id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Modal Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DocumentArrowUpIcon className="h-5 w-5 text-emerald-600" />
              Attached Documents
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
              {documents.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Brochures, legal contracts, and meeting reports attached to {opportunity?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Upload Modal (Includes Document Type Selector) */}
      <UploadDocuments
        opportunities={[opportunity]}
        initialOpportunityId={String(opportunity?.id || '')}
        onUpload={handleDocumentAdded}
        isModal={true}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Documents List */}
      <div className="pt-2">
        <DocumentsList documents={documents} onDelete={handleDocumentDeleted} />
      </div>
    </div>
  );
}
