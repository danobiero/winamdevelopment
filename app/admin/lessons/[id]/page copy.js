import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getLessonById, getLessonImages } from '../actions';

import EditLessonWrapper from './EditLessonWrapper';

export default async function EditLessonPage({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const { lesson, materials } = await getLessonById(params.id);
  const images = await getLessonImages();

  if (!lesson) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-semibold text-red-600">
          Error: Lesson not found
        </h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <EditLessonWrapper
        lesson={lesson}
        images={images}
        materials={materials}
      />
    </div>
  );
}
