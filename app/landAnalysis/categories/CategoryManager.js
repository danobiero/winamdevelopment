'use client';

import { getErrorMessage } from '../_lib/error-utils';
import { useState } from 'react';
import { useToast } from '@/app/_lib/ToastContext';

export default function CategoryManager({
  categories,
  createCategory,
  deleteCategory,
  updateCategory,
}) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const { showToast } = useToast();

  async function handleCreate() {
    if (!name.trim()) {
      return showToast('Category name is required', 'warning');
    }

    try {
      await createCategory(name.trim());
      showToast('Category created successfully', 'success');
      setName('');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function handleUpdate(id) {
    if (!editValue.trim()) {
      return showToast('Category name cannot be empty', 'warning');
    }

    try {
      await updateCategory(id, editValue.trim());
      showToast('Category updated', 'success');
      setEditingId(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure? This may affect linked properties.')) return;

    try {
      await deleteCategory(id);
      showToast('Category removed', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
      {/* 🔹 LEFT COLUMN: CREATE TOOL */}
      <aside className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-gray-900">
              System Categories
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Define high-level classification types for land analysis.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase text-gray-400 mb-1.5 block tracking-widest">
                Category Name
              </label>
              <input
                placeholder="e.g., Environmental Risk"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm transition-all font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 bg-gray-900 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]"
            >
              Add Category
            </button>
          </div>
        </div>
      </aside>

      {/* 🔹 RIGHT COLUMN: MANAGEMENT LIST */}
      <main className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-700">
              {categories?.length || 0} Total Categories
            </span>
            <span className="text-xs font-mono text-gray-400 uppercase">
              FLOW-NET / CONFIG
            </span>
          </div>

          <ul className="divide-y divide-gray-100">
            {categories?.map((c) => {
              const safeId = c.id ? String(c.id) : '';
              const displayId =
                safeId.length > 8
                  ? safeId.slice(-8).toUpperCase()
                  : safeId || 'NEW';

              return (
                <li
                  key={c.id || Math.random()}
                  className="px-6 py-5 flex items-center justify-between group hover:bg-gray-50/50"
                >
                  {editingId === c.id ? (
                    <div className="flex-1 flex gap-3 items-center">
                      <input
                        className="flex-1 px-4 py-2 border-2 border-blue-500 rounded-xl outline-none text-sm font-medium bg-white"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleUpdate(c.id)
                        }
                      />

                      <button
                        onClick={() => handleUpdate(c.id)}
                        className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs font-bold text-gray-400 px-2"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm font-bold text-gray-800 block mb-0.5">
                          {c.name}
                        </span>
                        <p className="text-xs font-mono text-gray-400 uppercase">
                          System ID: {displayId}
                        </p>
                      </div>

                      <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          className="text-xs font-bold text-gray-500 hover:text-blue-600"
                          onClick={() => {
                            setEditingId(c.id);
                            setEditValue(c.name);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          className="text-xs font-bold text-gray-300 hover:text-red-600"
                          onClick={() => handleDelete(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}

            {(!categories || categories.length === 0) && (
              <li className="px-6 py-12 text-center text-gray-400 text-sm">
                No categories found. Start by adding one.
              </li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
