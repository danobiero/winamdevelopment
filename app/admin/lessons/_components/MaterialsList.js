'use client';

import { useState } from 'react';
import { deleteLessonMaterial } from '../actions';
import { useToast } from '@/app/_lib/ToastContext'; // Updated to use @ alias

export default function MaterialsList({ materials, onDelete }) {
  const [items, setItems] = useState(materials);
  const { showToast } = useToast(); // Initialize toast function

  async function handleDelete(id, path) {
    const res = await deleteLessonMaterial(id, path);

    if (res?.error) {
      showToast(res.error, 'error');
      return;
    }

    if (res?.success) {
      if (typeof onDelete === 'function') {
        onDelete(id); // notify parent
      }
      setItems((prev) => prev.filter((m) => m.id !== id));
      showToast('Material deleted successfully', 'success');
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Uploaded Materials</h3>

      {items.length === 0 ? (
        <p className="text-gray-500">No materials uploaded yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
            >
              <div className="flex flex-col">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium underline"
                >
                  {m.name}
                </a>
                <span className="text-xs text-gray-500">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => handleDelete(m.id, m.storage_path)}
                className="text-red-600 font-semibold hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
