'use client';

import { useState } from 'react';
import Toast from './_components/Toast';
import { uploadOpportunityDocument } from './actions';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowLeftIcon,
  TagIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function UploadDocuments({
  opportunities = [],
  initialOpportunityId = '',
  onUpload,
  isModal = false,
  isOpen = true,
  onClose,
}) {
  const [opportunityId, setOpportunityId] = useState(
    () => initialOpportunityId || (opportunities.length === 1 ? String(opportunities[0].id) : '')
  );
  const [documentType, setDocumentType] = useState('brochure');
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      setFile(droppedFiles[0]);
    }
  };

  async function handleUpload(e) {
    e.preventDefault();

    if (!opportunityId) {
      setToast({ message: 'Please select an opportunity', type: 'error' });
      return;
    }
    if (!file) {
      setToast({ message: 'Please choose a file', type: 'error' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('opportunityId', opportunityId);
    formData.append('file', file);
    formData.append('documentType', documentType);

    const res = await uploadOpportunityDocument(formData);
    setLoading(false);

    if (res?.error) {
      setToast({ message: res.error, type: 'error' });
      return;
    }

    if (typeof onUpload === 'function') {
      onUpload(res.newDocument || res.document);
    }

    setToast({ message: 'Document uploaded successfully!', type: 'success' });
    setFile(null);

    if (isModal && typeof onClose === 'function') {
      onClose();
    }
  }

  const formContent = (
    <form onSubmit={handleUpload} className="space-y-5">
      {/* 1. SELECT OPPORTUNITY */}
      {opportunities.length === 1 ? (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <BuildingOffice2Icon className="h-4 w-4 text-slate-400" />
            Opportunity
          </label>
          <div className="p-3 bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl truncate">
            {opportunities[0].name} {opportunities[0].type ? `(${opportunities[0].type})` : ''}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <BuildingOffice2Icon className="h-4 w-4 text-slate-400" />
            Select Opportunity <span className="text-rose-500">*</span>
          </label>
          <select
            value={opportunityId}
            onChange={(e) => setOpportunityId(e.target.value)}
            required
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium text-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer"
          >
            <option value="">Choose an opportunity...</option>
            {opportunities.map((opp) => (
              <option key={opp.id} value={opp.id}>
                {opp.name} {opp.type ? `(${opp.type})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 2. DOCUMENT TYPE */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <TagIcon className="h-4 w-4 text-slate-400" />
          Document Type <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { value: 'brochure', label: 'Brochure / Deck', desc: 'Marketing' },
            { value: 'agreement', label: 'Agreement', desc: 'Legal' },
            { value: 'financials', label: 'Financials', desc: 'Statements' },
            { value: 'General', label: 'General Report', desc: 'Monthly Minutes' },
            { value: 'Project', label: 'Project Report', desc: 'Weekly Minutes' },
            { value: 'other', label: 'Other', desc: 'General' },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setDocumentType(type.value)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                documentType === type.value
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-xs font-bold leading-tight block">
                {type.label}
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                {type.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. UPLOAD FILE (DRAG & DROP) */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end px-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
            File Attachment <span className="text-rose-500">*</span>
          </label>
          {file && (
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <XMarkIcon className="h-3 w-3" /> Clear Selection
            </button>
          )}
        </div>

        <div
          className="relative group"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
            onChange={(e) => setFile(e.target.files?.[0])}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
              file
                ? 'border-emerald-500 bg-emerald-50/40 shadow-inner'
                : 'border-slate-200 bg-slate-50/50 hover:border-emerald-400 hover:bg-slate-50'
            } ${isDragging ? 'border-emerald-500 bg-emerald-100/50 scale-[1.01]' : ''}`}
          >
            <div className="flex flex-col items-center text-center pointer-events-none">
              {file ? (
                <>
                  <DocumentIcon className="h-10 w-10 text-emerald-600 mb-2" />
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[260px]">
                    {file.name}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Ready to Upload
                  </span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon
                    className={`h-10 w-10 mb-2 transition-colors duration-200 ${
                      isDragging ? 'text-emerald-600 animate-bounce' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {isDragging ? 'Drop file now' : 'Browse or drag file here'}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">
                    PDF, DOCX, XLSX, or Images up to 10MB
                  </span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* SUBMIT BUTTONS */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        {isModal && (
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>Upload Document</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  // If used as modal
  if (isModal) {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl my-6 flex flex-col border border-slate-100 max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          {/* Modal Header */}
          <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CloudArrowUpIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  Upload Document
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Attach brochures, agreements, or reports
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            {formContent}
          </div>
        </div>
      </div>
    );
  }

  // Standalone page view
  return (
    <div className="max-w-2xl mx-auto antialiased px-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Navigation & Header Group */}
      <div className="space-y-4 py-4">
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Opportunities</span>
        </Link>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CloudArrowUpIcon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
            <span>Upload <span className="text-blue-600">Documents</span></span>
          </h1>
          <p className="text-slate-500 mt-1">
            Attach PDFs, Docs, or Images to a specific opportunity.
          </p>
      </div>

      <div className="py-6">
        {formContent}
      </div>
    </div>
  );
}
