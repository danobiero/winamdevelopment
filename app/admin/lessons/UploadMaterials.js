'use client';

import { useState } from 'react';
import Toast from './Toast';
import { uploadLessonMaterial } from './actions';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ArrowPathIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function UploadMaterials({ lessons, onUpload }) {
  const [lessonId, setLessonId] = useState('');
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

    if (!lessonId) {
      setToast({ message: 'Please select a lesson', type: 'error' });
      return;
    }
    if (!file) {
      setToast({ message: 'Please choose a file', type: 'error' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('lessonId', lessonId);
    formData.append('file', file);

    const res = await uploadLessonMaterial(formData);
    setLoading(false);

    if (res?.error) {
      setToast({ message: res.error, type: 'error' });
      return;
    }

    if (typeof onUpload === 'function' && res.newMaterial) {
      onUpload(res.newMaterial);
    }

    setToast({ message: 'Material uploaded successfully!', type: 'success' });
    setLessonId('');
    setFile(null);
  }

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
          href="/admin/lessons"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Lessons</span>
        </Link>

        <div className="pb-6 border-b border-slate-100">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CloudArrowUpIcon className="h-8 w-8 text-emerald-600" />
            Upload Materials
          </h1>
          <p className="text-slate-500 mt-1">
            Attach PDFs, Docs, or Images to a specific lesson.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="py-6 space-y-6">
        {/* SELECT LESSON */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">
            Select Lesson
          </label>
          <div className="relative">
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.25rem',
              }}
            >
              <option value="">Choose a lesson...</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* UPLOAD FILE (DRAG & DROP ACTIVE) */}
        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <label className="text-sm font-bold text-slate-700">
              File Attachment
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
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
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
              onChange={(e) => setFile(e.target.files?.[0])}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className={`
                flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200
                ${
                  file
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-inner'
                    : 'border-slate-200 bg-slate-50/30 hover:border-emerald-400 hover:bg-slate-50/50'
                }
                ${isDragging ? 'border-emerald-500 bg-emerald-100/50 scale-[1.01] ring-4 ring-emerald-50' : ''}
              `}
            >
              <div className="flex flex-col items-center text-center pointer-events-none">
                {file ? (
                  <>
                    <DocumentIcon className="h-12 w-12 text-emerald-600 mb-3" />
                    <span className="text-sm font-bold text-slate-800 truncate max-w-[280px]">
                      {file.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 bg-emerald-100 px-2 py-1 rounded-md">
                      Ready to Upload
                    </span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon
                      className={`h-12 w-12 mb-3 transition-colors duration-200 ${isDragging ? 'text-emerald-600 animate-bounce' : 'text-slate-400'}`}
                    />
                    <span className="text-sm font-bold text-slate-700">
                      {isDragging
                        ? 'Drop file now'
                        : 'Browse or drag file here'}
                    </span>
                    <span className="text-xs font-medium text-slate-400 mt-1">
                      PDF, DOCX, or Images up to 10MB
                    </span>
                  </>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none transition-all mt-4"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="h-6 w-6 animate-spin" />
              <span>Uploading Material...</span>
            </>
          ) : (
            'Upload Material'
          )}
        </button>
      </form>
    </div>
  );
}
