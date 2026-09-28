'use client';

import { useState, useTransition } from 'react';
import { updateOpportunity } from '../actions';
import {
  PhotoIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';

export default function EditOpportunityFormClient({
  opportunity,
  images,
  onSaved,
}) {
  const [isPending, startTransition] = useTransition();
  const [selectedImage, setSelectedImage] = useState(opportunity.image_url);
  const [isFeatured, setIsFeatured] = useState(
    opportunity.is_featured || false
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    // Explicitly append the boolean flag since unchecked checkboxes don't submit data
    formData.append('is_featured', isFeatured);

    startTransition(async () => {
      await updateOpportunity(formData);
      if (onSaved) onSaved();
    });
  };

  const inputStyles =
    'w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 bg-white';
  const labelStyles = 'text-sm font-bold text-slate-700 ml-1 mb-1 block';

  return (
    <form onSubmit={handleSubmit} className="space-y-8 antialiased">
      <input type="hidden" name="id" value={opportunity.id} />

      {/* --- SECTION 1: BASIC INFO --- */}
      <div className="space-y-5">
        <div>
          <label className={labelStyles}>Opportunity Name</label>
          <input
            name="name"
            type="text"
            required
            defaultValue={opportunity.name}
            className={inputStyles}
            placeholder="e.g. Austin Multi-Family Fund II"
          />
        </div>

        {/* NUMERICAL GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelStyles}>Minimum Investment ($)</label>
            <input
              name="minimum_investment"
              type="number"
              step="0.01"
              required
              min="0"
              defaultValue={opportunity.minimum_investment}
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Total Value / Target ($)</label>
            <input
              name="total_value"
              type="number"
              step="0.01"
              min="0"
              defaultValue={opportunity.total_value}
              className={inputStyles}
              placeholder="e.g. 5000000"
            />
          </div>
          <div>
            <label className={labelStyles}>Duration (Months)</label>
            <input
              name="duration_months"
              type="number"
              min="1"
              defaultValue={opportunity.duration_months}
              className={inputStyles}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelStyles}>Opportunity Type</label>
            <select
              name="type"
              defaultValue={
                opportunity.type?.toLowerCase() === 'core'
                  ? 'core'
                  : opportunity.type
              }
              className={`${inputStyles} appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1.25rem',
              }}
            >
              <option value="core">Core</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Venture Capital">Venture Capital</option>
              <option value="Private Equity">Private Equity</option>
              <option value="Business Venture">Business Venture</option>
              <option value="Debt Fund">Debt Fund</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelStyles}>Expected Return (%)</label>
            <input
              name="expected_return"
              type="number"
              step="0.1"
              defaultValue={opportunity.expected_return}
              className={inputStyles}
              placeholder="e.g. 12.5"
            />
          </div>
        </div>

        {/* TOGGLE FOR FEATURED */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsFeatured(!isFeatured)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isFeatured ? 'bg-blue-600' : 'bg-slate-200'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${isFeatured ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
          <label
            className="text-sm font-bold text-slate-700 cursor-pointer"
            onClick={() => setIsFeatured(!isFeatured)}
          >
            Feature this opportunity on the dashboard
          </label>
        </div>
      </div>

      {/* --- SECTION 2: CONTENT --- */}
      <div className="space-y-5 pt-4 border-t border-slate-100">
        <div>
          <label className={labelStyles}>Short Description</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={opportunity.description || ''}
            className={inputStyles}
            placeholder="Briefly describe the investment opportunity..."
          />
        </div>

        <div>
          <label className={labelStyles}>Detailed Analysis</label>
          <textarea
            name="analysis"
            rows={5}
            // Note: Since analysis is a text[] array in the DB, we join it for the form textarea.
            // You will need to split this back into an array in your Server Action.
            defaultValue={
              opportunity.analysis ? opportunity.analysis.join('\n\n') : ''
            }
            className={`${inputStyles} font-normal text-sm`}
            placeholder="Provide a detailed breakdown of the opportunity (Separate paragraphs with double line breaks)..."
          />
        </div>
      </div>

      {/* --- SECTION 3: VISUALS --- */}
      <div className="pt-4 border-t border-slate-100">
        <label className={labelStyles}>Cover Image</label>
        <input type="hidden" name="image_url" value={selectedImage || ''} />

        <div className="flex flex-col md:flex-row gap-6 items-start mt-3">
          {/* Live Preview */}
          <div className="flex-shrink-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Selected Preview
            </p>
            <div className="relative h-40 w-40 rounded-2xl overflow-hidden border-2 border-blue-100 shadow-inner bg-slate-50 flex items-center justify-center">
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Selected Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1 shadow-lg">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-400">
                  <PhotoIcon className="h-8 w-8 mx-auto mb-1 opacity-50" />
                  <span className="text-xs font-medium">No Image</span>
                </div>
              )}
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
