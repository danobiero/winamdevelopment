'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import ConfirmDeleteModal from './_Components/ConfirmDeleteModal'; // Import the new modal
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

  // NEW: Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetImage, setTargetImage] = useState(null);

  const { showToast } = useToast();

  const loadImages = async () => {
    setFetching(true);
    const res = await getAllLessonImages();
    if (res.data) setImages(res.data);
    setFetching(false);
  };

  useEffect(() => {
    loadImages();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadStandaloneImage(formData);
    setLoading(false);

    if (res.error) showToast(res.error, 'error');
    else {
      showToast('Image uploaded successfully', 'success');
      setFile(null);
      loadImages();
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    showToast('URL copied to clipboard!', 'success');
  };

  // NEW: Open Modal instead of browser confirm
  const openDeleteModal = (img) => {
    setTargetImage(img);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetImage) return;

    setIsModalOpen(false); // Close modal immediately
    const res = await deleteLibraryImage(targetImage.name);

    if (res.error) {
      showToast(res.error, 'error');
    } else {
      showToast('Image permanently deleted', 'success'); // Toast shows here!
      loadImages();
    }
    setTargetImage(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 antialiased">
      {/* Custom Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        itemName={targetImage?.name}
      />

      {/* UPLOAD PANEL (Same as before) */}
      <section className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2 text-center">
          Upload New Image
        </h2>
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
            className="w-full sm:w-auto px-8 py-2 bg-emerald-600 text-white rounded-full font-bold shadow-lg hover:bg-emerald-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
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
            <PhotoIcon className="h-6 w-6 text-emerald-600" /> Current Image
            Assets
          </h2>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">
            {images.length} Files
          </span>
        </div>

        {fetching ? (
          <div className="flex justify-center py-20">
            <ArrowPathIcon className="h-10 w-10 animate-spin text-slate-200" />
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
                  alt=""
                />

                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(img.url)}
                    className="p-2 bg-white text-slate-800 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  </button>

                  {/* Now opens our custom modal */}
                  <button
                    onClick={() => openDeleteModal(img)}
                    className="p-2 bg-white text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
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
