import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { createLesson } from '../actions'; // adjust path if needed

export default async function CreateLessonPage() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  // Default image
  const defaultImage =
    'https://pvotsmrdlzifmeynkcun.supabase.co/storage/v1/object/public/lesson-images/digital_material.jpg';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Create New Lesson</h1>

      <form
        action={createLesson}
        className="space-y-6 bg-white p-8 rounded-lg border shadow-sm"
      >
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Name</label>
          <input
            name="name"
            required
            type="text"
            className="border p-2 rounded-md"
            placeholder="Lesson name"
          />
        </div>

        {/* Max Capacity */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Max Capacity</label>
          <input
            name="maxCapacity"
            type="number"
            min="1"
            max="100"
            className="border p-2 rounded-md"
            placeholder="e.g., 10"
          />
        </div>

        {/* Regular Price */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Regular Price ($)</label>
          <input
            name="regularPrice"
            type="number"
            min="0"
            max="10000"
            required
            className="border p-2 rounded-md"
            placeholder="e.g., 79"
          />
        </div>

        {/* Discount */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold">
            Discount<span className="text-gray-500"> (default 0)</span>
          </label>
          <input
            name="discount"
            type="number"
            min="0"
            max="100"
            defaultValue={0}
            className="border p-2 rounded-md"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Description</label>
          <textarea
            name="description"
            rows={4}
            className="border p-2 rounded-md"
            placeholder="Write a short description..."
          ></textarea>
        </div>

        {/* Hidden default image URL */}
        <input type="hidden" name="image" value={defaultImage} />

        {/* Category Select */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold">Category</label>

          <select
            name="category"
            className="border p-2 rounded-md"
            required
            defaultValue="1"
          >
            <option value="1">Lesson</option>
            <option value="2">Digital Material</option>
            <option value="3">Test</option>
          </select>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
          >
            Create Lesson
          </button>
        </div>
      </form>
    </div>
  );
}
