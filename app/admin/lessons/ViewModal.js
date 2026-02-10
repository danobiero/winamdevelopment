'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

export default function ViewModal({ lesson, materials = [] }) {
  const router = useRouter();
  const [showFull, setShowFull] = useState(false);

  if (!lesson) return null;

  const categoryMap = {
    1: 'Lesson',
    2: 'Digital Material',
    3: 'Test',
  };

  const curriculumText = lesson.curriculum || 'No curriculum provided';
  const handleClose = () => router.push('/admin/lessons');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      {/* Container: Full screen on mobile, max-xl on desktop */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-xl sm:rounded-2xl shadow-2xl relative flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {lesson.name}
            </h2>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              ID: #{lesson.id}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-6 space-y-8 overflow-y-auto">
          {/* STATS GRID */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Capacity
              </p>
              <p className="text-sm font-bold text-slate-700">
                {lesson.maxCapacity} Students
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Category
              </p>
              <p className="text-sm font-bold text-slate-700">
                {categoryMap[lesson.category]}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Price
              </p>
              <p className="text-sm font-bold text-slate-700">
                ${lesson.regularPrice}
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Discount
              </p>
              <p className="text-sm font-bold text-slate-700">
                ${lesson.discount} 
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Description
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {lesson.description || 'No description provided.'}
            </p>
          </div>

          {/* CURRICULUM */}
          <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100/50">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
              Curriculum
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {showFull
                ? curriculumText
                : curriculumText.length > 150
                  ? curriculumText.slice(0, 150) + '...'
                  : curriculumText}
            </p>

            {curriculumText.length > 150 && (
              <button
                onClick={() => setShowFull(!showFull)}
                className="text-blue-600 font-bold text-xs mt-3 flex items-center gap-1 hover:underline"
              >
                {showFull ? 'Show Less' : 'View Full Curriculum'}
              </button>
            )}
          </div>

          {/* MATERIALS LIST */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
              Associated Materials
            </h3>
            {materials.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-slate-400 text-sm font-medium">
                  No materials uploaded.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <div className="flex flex-col min-w-0">
                      <a
                        target="_blank"
                        href={m.file_url}
                        className="text-sm font-bold text-slate-800 hover:text-blue-600 truncate flex items-center gap-2"
                      >
                        {m.name}
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      </a>
                      <span className="text-[10px] font-medium text-slate-400">
                        Added {new Date(m.created_at).toLocaleDateString()}
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
            onClick={() => router.push(`/admin/lessons/${lesson.id}`)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <PencilSquareIcon className="h-5 w-5" />
            Edit Lesson Details
          </button>
        </div>
      </div>
    </div>
  );
}
