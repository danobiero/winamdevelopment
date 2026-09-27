'use client';

import { getErrorMessage } from '../_lib/error-utils';
import { useState } from 'react';

export default function OptionManager({
  options,
  categories,
  createOption,
  deleteOption,
  updateOption,
}) {
  const [form, setForm] = useState({ category_id: '', name: '', weight: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('');

  const resetFeedback = () => {
    setError('');
    setSuccess('');
  };

  function validate({ category_id, name, weight }) {
    if (!category_id) return 'Category is required';
    if (!name?.trim()) return 'Option name is required';
    if (weight === '' || isNaN(weight)) return 'Valid weight required';
    return null;
  }

  async function handleCreate() {
    resetFeedback();
    const validation = validate(form);
    if (validation) return setError(validation);

    try {
      await createOption({
        category_id: Number(form.category_id),
        name: form.name.trim(),
        weight: Number(form.weight),
      });
      setSuccess('Option added to system');
      setForm({ category_id: '', name: '', weight: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleUpdate(id) {
    resetFeedback();
    const validation = validate(editForm);
    if (validation) return setError(validation);

    try {
      await updateOption(id, {
        category_id: Number(editForm.category_id),
        name: editForm.name.trim(),
        weight: Number(editForm.weight),
      });
      setSuccess('Option updated');
      setEditingId(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this option?')) return;
    resetFeedback();
    try {
      await deleteOption(id);
      setSuccess('Option removed');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const filteredOptions = options.filter(
    (o) =>
      o.name.toLowerCase().includes(filter.toLowerCase()) ||
      o.categories?.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 p-6">
      {/* 🔹 LEFT COLUMN: CREATE FORM (1/4 width) */}
      <aside className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">New Option</h2>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                Parent Category
              </label>
              <select
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
              >
                <option value="">Select...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                Option Label
              </label>
              <input
                placeholder="e.g., Access to Paved Road"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block">
                Weighted Score
              </label>
              <input
                type="number"
                placeholder="0-100"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-mono"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
              />
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98]"
            >
              Add Option
            </button>

            {(error || success) && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}
              >
                {error || success}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 🔹 RIGHT COLUMN: OPTION TABLE (3/4 width) */}
      <main className="lg:col-span-3">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-700">
              Configuration Registry
            </h3>
            <input
              type="text"
              placeholder="Search options..."
              className="text-xs border rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500/10 outline-none w-48"
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-black border-b border-gray-100">
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Option Name</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOptions.map((o) => (
                  <tr
                    key={o.id}
                    className="group hover:bg-gray-50/50 transition-colors"
                  >
                    {editingId === o.id ? (
                      /* 🔹 IN-LINE EDITING MODE */
                      <td colSpan="4" className="px-6 py-4 bg-blue-50/30">
                        <div className="flex gap-4 items-center">
                          <select
                            className="text-xs border rounded-md p-1"
                            value={editForm.category_id}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category_id: e.target.value,
                              })
                            }
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                          <input
                            className="flex-1 text-xs border rounded-md p-1"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                          <input
                            type="number"
                            className="w-16 text-xs border rounded-md p-1 font-mono"
                            value={editForm.weight}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                weight: e.target.value,
                              })
                            }
                          />
                          <button
                            onClick={() => handleUpdate(o.id)}
                            className="text-xs font-bold text-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs font-bold text-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    ) : (
                      /* 🔹 DISPLAY MODE */
                      <>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase">
                            {o.categories?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-800">
                          {o.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono font-bold text-blue-600">
                            +{o.weight}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="text-xs font-bold text-gray-400 hover:text-blue-600"
                              onClick={() => {
                                setEditingId(o.id);
                                setEditForm(o);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-xs font-bold text-gray-300 hover:text-red-600"
                              onClick={() => handleDelete(o.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
