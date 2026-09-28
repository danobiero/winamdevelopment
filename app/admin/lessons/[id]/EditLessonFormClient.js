'use client';

import { useState, useTransition } from 'react';
import { updateLesson } from '../actions';
import {
  PhotoIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';

export default function EditLessonFormClient({ lesson, images, onSaved }) {
  const [isPending, startTransition] = useTransition();
  const [selectedImage, setSelectedImage] = useState(lesson.image);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    startTransition(async () => {
      await updateLesson(formData);
      if (onSaved) onSaved();
    });
  };

  const inputStyles =
    'w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 bg-white';
  const labelStyles = 'text-sm font-bold text-slate-700 ml-1 mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="space-y-8 antialiased">
      <input type="hidden" name="id" value={lesson.id} />

      {/* --- SECTION 1: BASIC INFO --- */}
      <div className="space-y-5">
        <div>
          <label className={labelStyles}>Lesson Name</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={lesson.name}
            className={inputStyles}
            placeholder="e.g. Advanced Piano Masterclass"
          />
        </div>

        {/* NUMERICAL GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelStyles}>Max Capacity</label>
            <input
              name="maxCapacity"
              type="number"
              min="1"
              defaultValue={lesson.maxCapacity}
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Regular Price ($)</label>
            <input
              name="regularPrice"
              type="number"
              required
              min="0"
              defaultValue={lesson.regularPrice}
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Discount ($)</label>
            <input
              name="discount"
              type="number"
              min="0"
              max="100"
              defaultValue={lesson.discount}
              className={inputStyles}
            />
          </div>
        </div>

        <div>
          <label className={labelStyles}>Category</label>
          <select
            name="category"
            defaultValue={lesson.category}
            className={`${inputStyles} appearance-none`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              backgroundSize: '1.25rem',
            }}
          >
            <option value="1">Lesson</option>
            <option value="2">Digital Material</option>
            <option value="3">Test</option>
          </select>
        </div>
      </div>

      {/* --- SECTION 2: CONTENT --- */}
      <div className="space-y-5">
        <div>
          <label className={labelStyles}>Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={lesson.description || ''}
            className={inputStyles}
            placeholder="Briefly describe the lesson..."
          />
        </div>

        <div>
          <label className={labelStyles}>Curriculum</label>
          <textarea
            name="curriculum"
            rows={5}
            defaultValue={lesson.curriculum || ''}
            className={`${inputStyles} font-normal text-sm`}
            placeholder="Detailed curriculum content..."
          />
        </div>
      </div>

      {/* --- SECTION 3: VISUALS --- */}
      <div className="pt-4 border-t border-slate-100">
        <label className={labelStyles}>Lesson Image</label>
        <input type="hidden" name="image" value={selectedImage} />

        <div className="flex flex-col md:flex-row gap-6 items-start mt-3">
          {/* Live Preview */}
          <div className="flex-shrink-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Selected Preview
            </p>
            <div className="relative h-40 w-40 rounded-2xl overflow-hidden border-2 border-blue-100 shadow-inner bg-slate-50">
              <img
                src={selectedImage}
                alt="Selected Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg">
                <CheckCircleIcon className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Change Image
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/50">
              {images.map((img) => (
                <button
                  key={img.url}
                  type="button"
                  onClick={() => setSelectedImage(img.url)}
                  className={`
                    relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105
                    ${selectedImage === img.url ? 'border-blue-600' : 'border-transparent hover:border-slate-300'}
                  `}
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER: ACTIONS --- */}
      <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition active:scale-95 text-center"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center justify-center gap-2 px-10 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95 disabled:bg-slate-300"
        >
          {isPending ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            'Save & Continue'
          )}
        </button>
      </div>
    </form>
  );
}
