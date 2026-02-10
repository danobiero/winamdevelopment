'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditLessonFormClient from './EditLessonFormClient';
import LessonMaterialsClient from './LessonMaterialsClient';

export default function EditLessonWrapper({ lesson, images, materials }) {
  const [step, setStep] = useState(1);
  const router = useRouter();

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold">Edit Lesson — Step {step} of 2</h1>

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <EditLessonFormClient
            lesson={lesson}
            images={images}
            onSaved={() => setStep(2)} // 🔥 move to Step 2 after save
          />

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Materials */}
      {step === 2 && (
        <div>
          <LessonMaterialsClient lesson={lesson} initialMaterials={materials} />

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              ← Previous
            </button>

            <button
              onClick={() => router.push('/admin/lessons')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
