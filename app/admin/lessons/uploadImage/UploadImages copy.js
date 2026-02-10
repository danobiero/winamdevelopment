'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  uploadStandaloneImage,
  getAllLessonImages,
  deleteLibraryImage,
} from './../actions';
import {
  CloudArrowUpIcon,
  PhotoIcon,
  TrashIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

export default function ImageLibrary() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { showToast } = useToast();

  const loadImages = async () => {
    setFetching(true);
    const res = await getAllLessonImages();
    if (res.error) {
      showToast(res.error, 'error');
    } else if (res.data) {
      setImages(res.data);
    }
    setFetching(false);
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return showToast('Please select a file first', 'warning');

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadStandaloneImage(formData);
    setLoading(false);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Image uploaded successfully!', 'success');
      setFile(null);
      loadImages(); // Refresh the grid
    }
  };

  const copyUrl = (url) => {
    if (!url) return showToast('URL not found', 'error');

    navigator.clipboard
      .writeText(url)
      .then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy link', 'error'));
  };

  const handleDelete = async (name) => {
    if (!confirm('Permanently delete this image from storage?')) return;

    // Optimistic UI could be added here, but for safety, we wait for the server
    const res = await deleteLibraryImage(name);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Image permanently deleted', 'success');
      loadImages(); // Refresh the grid
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 antialiased">
      {/* UPLOAD PANEL */}
      <section className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Upload New Image
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Files stored here can be used in any lesson description or material.
        </p>

        <form
          onSubmit={handleUpload}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 transition-all cursor-pointer"
          />
          <button
            disabled={!file || loading}
            className="w-full sm:w-auto px-8 py-2 bg-emerald-600 text-white rounded-full font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <CloudArrowUpIcon className="h-5 w-5" />
            )}
            {loading ? 'Uploading...' : 'Upload Now'}
          </button>
        </form>
      </section>

      {/* IMAGE GRID */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PhotoIcon className="h-6 w-6 text-emerald-600" />
            Current Image Assets
          </h2>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">
            {images.length} Files
          </span>
        </div>

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ArrowPathIcon className="h-10 w-10 animate-spin text-emerald-500" />
            <p className="text-slate-400 font-medium">
              Loading your library...
            </p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400">
            <PhotoIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>No images found in storage.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {images.map((img) => (
              <div
                key={img.name}
                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={img.url}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  alt={img.name}
                  loading="lazy"
                />

                {/* ACTIONS OVERLAY */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(img.url)}
                    className="p-2.5 bg-white text-slate-800 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
                    title="Copy Public URL"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(img.name)}
                    className="p-2.5 bg-white text-rose-600 rounded-xl hover:bg-rose-50 hover:text-rose-700 transition-all active:scale-95"
                    title="Delete Permanently"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
