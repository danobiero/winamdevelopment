import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { createLesson } from '../actions'; // adjust path if needed
import Link from 'next/link'; // Import Link
import { ArrowLeftIcon } from '@heroicons/react/24/solid'; // Optional icon

export default async function CreateLessonPage() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  // Default image
  const defaultImage =
    'https://pvotsmrdlzifmeynkcun.supabase.co/storage/v1/object/public/lesson-images/digital_material.jpg';

  return (
    /* Added px-4 for mobile edge spacing and reduced top/bottom space on small screens */
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold">Create New Lesson</h1>
      <Link
        href="/admin"
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <form
        action={createLesson}
        /* Adjusted padding: p-6 for mobile, p-8 for desktop */
        className="space-y-5 sm:space-y-6 bg-white p-6 sm:p-8 rounded-lg border shadow-sm"
      >
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm sm:text-base">Name</label>
          <input
            name="name"
            required
            type="text"
            className="border p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Lesson name"
          />
        </div>

        {/* Form Row: Capacity and Price (Stacks on mobile, side-by-side on tablet+) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm sm:text-base">
              Max Capacity
            </label>
            <input
              name="maxCapacity"
              type="number"
              min="1"
              max="100"
              className="border p-2.5 rounded-md"
              placeholder="e.g., 10"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-semibold text-sm sm:text-base">
              Regular Price ($)
            </label>
            <input
              name="regularPrice"
              type="number"
              min="0"
              max="10000"
              required
              className="border p-2.5 rounded-md"
              placeholder="e.g., 79"
            />
          </div>
        </div>

        {/* Discount */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm sm:text-base">
            Discount
            <span className="text-gray-500 font-normal"> (default 0)</span>
          </label>
          <input
            name="discount"
            type="number"
            min="0"
            max="100"
            defaultValue={0}
            className="border p-2.5 rounded-md"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm sm:text-base">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            className="border p-2.5 rounded-md"
            placeholder="Write a short description..."
          ></textarea>
        </div>

        {/* Category Select */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-sm sm:text-base">Category</label>
          <select
            name="category"
            className="border p-2.5 rounded-md bg-white"
            required
            defaultValue="1"
          >
            <option value="1">Lesson</option>
            <option value="2">Digital Material</option>
            <option value="3">Test</option>
          </select>
        </div>

        <input type="hidden" name="image" value={defaultImage} />

        {/* Submit button - Full width on mobile, auto width on desktop */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition active:scale-95"
          >
            Create Lesson
          </button>
        </div>
      </form>
    </div>
  );
}
