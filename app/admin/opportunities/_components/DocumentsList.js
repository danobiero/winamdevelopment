'use client';

import { useState, useEffect } from 'react';
import { deleteOpportunityDocument } from '../actions';
import { useToast } from '@/app/_lib/ToastContext';
import {
  DocumentTextIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function DocumentsList({ documents = [], onDelete }) {
  const [items, setItems] = useState(documents || []);
  const { showToast } = useToast();

  useEffect(() => {
    setItems(documents || []);
  }, [documents]);

  async function handleDelete(id, path, name) {
    if (!window.confirm(`Delete document "${name}"?`)) return;

    const res = await deleteOpportunityDocument(id, path);

    if (res?.error) {
      showToast(res.error, 'error');
      return;
    }

    if (res?.ok || res?.success) {
      if (typeof onDelete === 'function') {
        onDelete(id);
      }
      setItems((prev) => prev.filter((doc) => doc.id !== id));
      showToast('Document deleted successfully', 'success');
    }
  }

  const getTypeBadge = (doc) => {
    const rawName = (doc.name || '').toLowerCase();
    const docType = (doc.document_type || '').toLowerCase();

    if (docType === 'general' || rawName.includes('[general]')) {
      return {
        label: 'General Report',
        classes: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
    if (docType === 'project' || rawName.includes('[project]')) {
      return {
        label: 'Project Report',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (docType === 'agreement' || rawName.includes('agreement')) {
      return {
        label: 'Agreement',
        classes: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }
    if (docType === 'financials' || rawName.includes('financial')) {
      return {
        label: 'Financials',
        classes: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    if (docType === 'brochure' || rawName.includes('brochure')) {
      return {
        label: 'Brochure',
        classes: 'bg-sky-50 text-sky-700 border-sky-200',
      };
    }
    return {
      label: doc.document_type || 'Document',
      classes: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center bg-slate-50 border border-dashed border-slate-200 p-8 rounded-2xl">
          <DocumentTextIcon className="h-10 w-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No documents uploaded yet</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Click &quot;Upload Document&quot; above to attach brochures, agreements, or reports.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((doc) => {
            const badge = getTypeBadge(doc);

            return (
              <li
                key={doc.id}
                className="flex items-center justify-between p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 shrink-0">
                    <DocumentTextIcon className="h-5 w-5 text-slate-600" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate underline-offset-2 hover:underline"
                        title={doc.name}
                      >
                        {doc.name}
                      </a>

                      <span
                        className={`inline-flex items-center px-2 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider border ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>{new Date(doc.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="View Document"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id, doc.storage_path, doc.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
