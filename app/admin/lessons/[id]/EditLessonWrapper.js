'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditLessonFormClient from './EditLessonFormClient';
import LessonMaterialsClient from './LessonMaterialsClient';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';

export default function EditLessonWrapper({ lesson, images, materials }) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  return (
    <div className="space-y-8 antialiased">
      {/* VISUAL STEP INDICATOR */}
      <div className="flex items-center justify-center sm:justify-start gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-emerald-500 text-white'}`}
          >
            {step > 1 ? <CheckIcon className="h-5 w-5" /> : '1'}
          </div>
          <span
            className={`text-sm font-bold ${step === 1 ? 'text-slate-900' : 'text-slate-400'}`}
          >
            Details
          </span>
        </div>

        <div className="h-px w-12 bg-slate-200" />

        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step === 2 ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-200 text-slate-500'}`}
          >
            2
          </div>
          <span
            className={`text-sm font-bold ${step === 2 ? 'text-slate-900' : 'text-slate-400'}`}
          >
            Materials
          </span>
        </div>
      </div>

      {/* STEP 1: Lesson Details */}
      {step === 1 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
            <EditLessonFormClient
              lesson={lesson}
              images={images}
              onSaved={() => setStep(2)}
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md active:scale-95"
            >
              <span>Next Step</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Materials Management */}
      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
            <LessonMaterialsClient
              lesson={lesson}
              initialMaterials={materials}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition active:scale-95"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => router.push('/admin/lessons')}
              className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition shadow-md active:scale-95"
            >
              Exit & Finish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
