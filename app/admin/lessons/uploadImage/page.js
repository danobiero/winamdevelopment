import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import ImageLibrary from './UploadImages';
import ToastListener from '@/app/admin/lessons/ToastListener';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function UploadImage() {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10 px-4">
      {/* Listens for notifications triggered via URL/Redirects */}
      <ToastListener />

      {/* Navigation & Header Group */}
      <div className="space-y-4 pt-4">
        <Link
          href="/admin/lessons"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Lessons</span>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Image Library
          </h1>
          <p className="text-slate-500 mt-1">
            Manage global assets stored in the storage root.
          </p>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Main Image Library Logic */}
      <ImageLibrary />
    </div>
  );
}
