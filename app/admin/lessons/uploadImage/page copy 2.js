import { auth } from '@/app/_lib/auth';
import ToastListener from '@/app/admin/lessons/ToastListener'; // Adjust path as needed
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ImageLibrary from './UploadImages'; // Ensure the import matches your filename

export default async function UploadImage() {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Listens for notifications triggered via URL/Redirects */}
      <ToastListener />
      <Link
        href="/admin/lessons"
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        <span>Back to Lessons</span>
      </Link>

      <div className="px-4">
        <h1 className="text-3xl font-bold text-slate-900">Upload Images</h1>
        <p className="text-slate-500">
          Manage global assets stored in the storage root.
        </p>
      </div>

      <ImageLibrary />
    </div>
  );
}
