'use client';

import { useState } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import { uploadReportAction } from './actions';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  TagIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function UploadReportModal({ opportunities = [], onClose, onReportAdded }) {
  const { showToast } = useToast();
  const [opportunityId, setOpportunityId] = useState('');
  const [reportType, setReportType] = useState('General'); // 'General' or 'Project'
  const [reportDate, setReportDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Selected opportunity object
  const selectedOpp = opportunities.find((o) => String(o.id) === String(opportunityId));
  const oppName = selectedOpp ? selectedOpp.name : 'Select Opportunity';

  // Dynamic preview of the report title
  const previewTitle = `[${reportType}] ${oppName} - ${reportDate}${
    notes.trim() ? ` (${notes.trim()})` : ''
  }`;

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!opportunityId) {
      showToast('Please select an Opportunity to link this report to.', 'error');
      return;
    }
    if (!file) {
      showToast('Please choose or drag in a document file.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('opportunityId', opportunityId);
      formData.append('reportType', reportType);
      formData.append('reportDate', reportDate);
      formData.append('notes', notes);
      formData.append('file', file);

      const res = await uploadReportAction(formData);

      if (res?.error) {
        showToast(res.error, 'error');
        return;
      }

      showToast('Report successfully uploaded!', 'success');
      if (onReportAdded && res.report) {
        onReportAdded(res.report);
      }

      onClose();
    } catch (err) {
      showToast(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl my-6 flex flex-col border border-slate-100 max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <CloudArrowUpIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                Attach Meeting Report
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Upload minutes and link directly to an opportunity
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* 1. Opportunity Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <BuildingOffice2Icon className="h-4 w-4 text-slate-400" />
              1. Select Opportunity <span className="text-rose-500">*</span>
            </label>
            <select
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="">Choose Opportunity to attach to...</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.name} {opp.type ? `(${opp.type})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Report Category (General vs Project) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <TagIcon className="h-4 w-4 text-slate-400" />
              2. Report Type & Frequency <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* General Option */}
              <button
                type="button"
                onClick={() => setReportType('General')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === 'General'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                    GENERAL
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase bg-blue-100 text-blue-800">
                    Monthly
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Monthly meeting minutes for core opportunity and leadership governance.
                </p>
              </button>

              {/* Project Option */}
              <button
                type="button"
                onClick={() => setReportType('Project')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  reportType === 'Project'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    PROJECT
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                    Weekly
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Weekly project updates and operational meeting minutes.
                </p>
              </button>
            </div>
          </div>

          {/* 3. Creation / Meeting Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
                3. Meeting / Creation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs rounded-xl focus:bg-white focus:border-amber-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Optional Topic / Subtitle
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Progress Review"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-xl focus:bg-white focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Title Preview */}
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
              <InformationCircleIcon className="h-4 w-4 text-amber-600" />
              Generated Report Title:
            </div>
            <div className="text-xs font-mono font-bold text-slate-800 break-all bg-white/80 p-2 rounded-lg border border-amber-100">
              {previewTitle}
            </div>
          </div>

          {/* 4. File Attachment */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                4. Report Document (PDF, DOCX, etc.) <span className="text-rose-500">*</span>
              </label>
              {file && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                >
                  <XMarkIcon className="h-3.5 w-3.5" /> Remove
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
                id="report-file-input"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <label
                htmlFor="report-file-input"
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                  file
                    ? 'border-amber-500 bg-amber-50/40 shadow-inner'
                    : 'border-slate-200 bg-slate-50/50 hover:border-amber-400 hover:bg-slate-50'
                } ${isDragging ? 'border-amber-500 bg-amber-100/50 scale-[1.01]' : ''}`}
              >
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <DocumentIcon className="h-10 w-10 text-amber-600 mb-2" />
                    <span className="text-xs font-bold text-slate-800 max-w-[260px] truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5">
                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-2 bg-amber-100 px-2 py-0.5 rounded-md">
                      Ready to Upload
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <CloudArrowUpIcon className="h-10 w-10 text-slate-400 group-hover:text-amber-600 mb-2 transition-colors" />
                    <span className="text-xs font-bold text-slate-700">
                      Click to choose or drag & drop report file here
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Supports PDF, Word (DOCX), Excel, and images
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Uploading to Storage...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4" />
                  <span>Attach & Save Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
