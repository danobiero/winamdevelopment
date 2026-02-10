'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-lg relative">
        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">{lesson.name}</h2>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-black text-2xl"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* BASIC INFO */}
          <div className="space-y-2 text-gray-700 text-sm">
            <p>
              <span className="font-semibold">Max Capacity:</span>{' '}
              {lesson.maxCapacity}
            </p>
            <p>
              <span className="font-semibold">Price:</span> $
              {lesson.regularPrice}
            </p>
            <p>
              <span className="font-semibold">Discount:</span> {lesson.discount}
              %
            </p>
            <p>
              <span className="font-semibold">Category:</span>{' '}
              {categoryMap[lesson.category]}
            </p>

            <div>
              <p className="font-semibold">Description:</p>
              <p>{lesson.description || 'No description.'}</p>
            </div>

            {/* CURRICULUM */}
            <div>
              <p className="font-semibold">Curriculum:</p>
              <p className="whitespace-pre-wrap">
                {showFull
                  ? curriculumText
                  : curriculumText.length > 150
                    ? curriculumText.slice(0, 150) + '...'
                    : curriculumText}
              </p>

              {curriculumText.length > 150 && (
                <button
                  onClick={() => setShowFull(!showFull)}
                  className="text-blue-600 hover:underline text-sm mt-1"
                >
                  {showFull ? 'Show Less' : 'View Full Curriculum'}
                </button>
              )}
            </div>
          </div>

          {/* MATERIALS LIST */}
          <div className="pt-4">
            <p className="font-semibold text-gray-800 mb-2">Materials:</p>

            {materials.length === 0 ? (
              <p className="text-gray-500 text-sm">No materials uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between bg-gray-50 border p-3 rounded-md"
                  >
                    <a
                      target="_blank"
                      href={m.file_url}
                      className="text-blue-600 font-medium underline truncate max-w-[220px]"
                    >
                      {m.name}
                    </a>

                    <span className="text-xs text-gray-500">
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t">
          <a
            href={`/admin/lessons/${lesson.id}`}
            className="block text-center bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700"
          >
            Edit Lesson
          </a>
        </div>
      </div>
    </div>
  );
}
