'use client';

import { useState } from 'react';
import { useToast } from '@/app/_lib/ToastContext';

const MULTI_SELECT = ['Utility Access', 'Taxes'];

export default function PropertyForm({
  categories,
  createPropertyWithSelections,
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  ////////////////////////////////////////////////////////////
  // SUBMIT HANDLER
  ////////////////////////////////////////////////////////////
  async function handleSubmit(e) {
    e.preventDefault();

    // 🔥 prevent double submit
    if (loading) return;

    setLoading(true);

    const formData = new FormData(e.target);

    try {
      
      const property = await createPropertyWithSelections(name, formData);
      showToast('Saved successfully', 'success');

      // optional reset
      e.target.reset();
      setName('');
    } catch (err) {
      console.error(err);

      ////////////////////////////////////////////////////////////
      // ERROR
      ////////////////////////////////////////////////////////////
      showToast(err?.message || 'Error saving property', 'error');
    } finally {
      setLoading(false);
    }
  }

  ////////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////////
  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl mx-auto p-10 bg-white rounded-3xl shadow-xl border border-gray-100"
    >
      {/* 🔹 SECTION 1: FULL WIDTH IDENTITY */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 bg-blue-600 rounded-full" />
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Property Entry
          </h2>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">
            Official Address or Parcel ID
          </label>
          <input
            placeholder="Search or enter property name..."
            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-xl font-semibold text-gray-800 placeholder:text-gray-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* 🔹 SECTION 2: CATEGORY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {categories.map((cat) => (
          <div key={cat.id} className="group">
            <div className="flex justify-between items-end mb-3 px-1">
              <label className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </label>

              {MULTI_SELECT.includes(cat.name) && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-tighter">
                  Multi-Select
                </span>
              )}
            </div>

            {/* MULTI SELECT */}
            {MULTI_SELECT.includes(cat.name) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 group-hover:border-blue-100 transition-colors">
                {cat.options.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                  >
                    <input
                      type="checkbox"
                      name={`category-${cat.id}`}
                      value={opt.id}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        {opt.name}
                      </span>
                      <span className="text-[10px] font-mono text-blue-500">
                        Weight: +{opt.weight}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              /* SINGLE SELECT */
              <div className="relative">
                <select
                  name={`category-${cat.id}`}
                  className="w-full appearance-none px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:border-blue-500 outline-none cursor-pointer text-sm font-semibold text-gray-700 hover:border-gray-200 transition-all"
                >
                  <option value="">Choose primary attribute...</option>
                  {cat.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name} (Impact: +{opt.weight})
                    </option>
                  ))}
                </select>

                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-gray-400">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 🔹 SUBMIT DRAWER */}
      <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-400 max-w-xs italic">
          Data entries for <b>FLOW-NET</b> are processed in real-time. Please
          verify all weights before submission.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="group relative px-10 py-4 bg-gray-900 overflow-hidden text-white font-black rounded-2xl shadow-2xl transition-all hover:bg-blue-600 active:scale-95 disabled:bg-gray-300"
        >
          <span className="relative z-10">
            {loading ? 'ANALYZING...' : 'SAVE TO FLOW-NET'}
          </span>

          <div className="absolute inset-0 bg-blue-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>
    </form>
  );
}
