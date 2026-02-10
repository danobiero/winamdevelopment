import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getLessonById, getLessonImages } from '../actions';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import EditLessonWrapper from './EditLessonWrapper';

export default async function EditLessonPage({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const { lesson, materials } = await getLessonById(params.id);
  const images = await getLessonImages();

  if (!lesson) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Lesson Not Found</h1>
        <p className="text-slate-500 mt-2 font-medium">
          The lesson you are trying to edit may have been deleted or moved.
        </p>
      </div>
    );
  }

  return (
    /* RESPONSIVE CONTAINER:
       - Mobile: Full width with horizontal padding (px-4), reduced top padding (py-4)
       - Desktop (sm+): max-w-3xl and py-10 for a centered, spacious look
    */
    <div className="max-w-3xl mx-auto px-4 py-4 sm:px-0 sm:py-10 antialiased">
      <div className="mb-8 px-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Edit Lesson
        </h1>

        <p className="text-sm sm:text-base text-slate-500 font-medium mt-2 leading-relaxed">
          <span className="block sm:inline">
            Update the details and curriculum for:
          </span>
          <span className="text-blue-600 block sm:inline sm:ml-1 font-bold break-words">
            "{lesson.name}"
          </span>
        </p>
      </div>
      
      <EditLessonWrapper
        lesson={lesson}
        images={images}
        materials={materials}
      />
    </div>
  );
}
