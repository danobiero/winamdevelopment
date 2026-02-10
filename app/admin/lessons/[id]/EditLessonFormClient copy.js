'use client';

import { useState, useTransition } from 'react';
import { updateLesson } from '../actions';

/* export default function EditLessonFormClient({ lesson, images }) {
  const [isPending, startTransition] = useTransition();
  const [selectedImage, setSelectedImage] = useState(lesson.image);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    await updateLesson(formData);
  };
 */
export default function EditLessonFormClient({ lesson, images, onSaved }) {
  const [isPending, startTransition] = useTransition();
  const [selectedImage, setSelectedImage] = useState(lesson.image);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    startTransition(async () => {
      await updateLesson(formData);

      // 🔥 Notify parent wrapper that save is complete
      if (onSaved) onSaved();
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white p-8 rounded-lg border shadow-sm"
    >
      {/* Hidden ID field */}
      <input type="hidden" name="id" value={lesson.id} />

      {/* NAME */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Lesson Name</label>
        <input
          name="name"
          type="text"
          required
          defaultValue={lesson.name}
          className="border p-2 rounded-md"
        />
      </div>

      {/* MAX CAPACITY */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Max Capacity</label>
        <input
          name="maxCapacity"
          type="number"
          min="1"
          defaultValue={lesson.maxCapacity}
          className="border p-2 rounded-md"
        />
      </div>

      {/* REGULAR PRICE */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Regular Price ($)</label>
        <input
          name="regularPrice"
          type="number"
          required
          min="0"
          defaultValue={lesson.regularPrice}
          className="border p-2 rounded-md"
        />
      </div>

      {/* DISCOUNT */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Discount</label>
        <input
          name="discount"
          type="number"
          min="0"
          defaultValue={lesson.discount}
          className="border p-2 rounded-md"
        />
      </div>

      {/* DESCRIPTION */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={lesson.description || ''}
          className="border p-2 rounded-md"
        ></textarea>
      </div>

      {/* CURRICULUM */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Curriculum</label>
        <textarea
          name="curriculum"
          rows={6}
          defaultValue={lesson.curriculum || ''}
          className="border p-2 rounded-md"
          placeholder="Curriculum content..."
        ></textarea>
      </div>

      {/* CATEGORY */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Category</label>
        <select
          name="category"
          defaultValue={lesson.category}
          className="border p-2 rounded-md"
        >
          <option value="1">Lesson</option>
          <option value="2">Digital Material</option>
          <option value="3">Test</option>
        </select>
      </div>

      {/* IMAGE SELECTOR GALLERY */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">Select Lesson Image</label>
        {/* Hidden input that stores the selected image URL */}
        <input type="hidden" name="image" value={selectedImage} />
        {/* GALLERY GRID */}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-2">
          {images.map((img) => (
            <div
              key={img.url}
              onClick={() => setSelectedImage(img.url)}
              className={`
                border rounded-md overflow-hidden cursor-pointer transition 
                ${selectedImage === img.url ? 'border-blue-600 ring-2 ring-blue-400' : 'border-gray-300'}
              `}
            >
              <img
                src={img.url}
                alt={img.name}
                className="object-cover w-full h-24"
              />
            </div>
          ))}
        </div>
        {/* Live Preview */}
        <div className="mt-4">
          <p className="text-sm text-gray-600 font-medium mb-1">Preview:</p>
          <img
            src={selectedImage}
            alt="Selected Preview"
            className="w-32 h-32 object-cover rounded-md border"
          />
        </div>
      </div>

      {/* SUBMIT */}
      <div className="pt-4 flex justify-end gap-4">
        <a
          href="/admin/lessons"
          className="px-6 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition font-semibold"
        >
          Cancel
        </a>

        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
