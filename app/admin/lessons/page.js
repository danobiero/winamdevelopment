import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import AdminDeleteLesson from './_components/AdminDeleteLesson';
import AdminToggleStatus from './_components/AdminToggleStatus';
import {
  checkLessonHasBookings,
  deleteLessonAction,
  getLessonById,
  getLessons,
} from './actions';
import ViewModal from './ViewModal';
import {
  PlusIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import ToastListener from './ToastListener';

export default async function LessonsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const viewId = searchParams?.view || null;

  let viewedLesson = null;
  if (viewId) {
    viewedLesson = await getLessonById(viewId);
  }

  const lessons = await getLessons();

  for (const lesson of lessons) {
    const result = await checkLessonHasBookings(lesson.id);
    lesson.hasBookings = result.hasBookings;
    lesson.bookingCount = result.count;
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <ToastListener />

      {viewedLesson && (
        <ViewModal
          lesson={viewedLesson.lesson}
          materials={viewedLesson.materials}
        />
      )}

      {/* Header + Create Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Lessons
        </h1>

        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
          <Link
            href="/admin/lessons/new"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Create</span>
          </Link>

          <Link
            href="/admin/lessons/upload"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            <span>Upload</span>
          </Link>

          <Link
            href="/admin/lessons/uploadImage"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-900 transition shadow-sm"
          >
            <PhotoIcon className="h-4 w-4" />
            <span>Images</span>
          </Link>
        </div>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className={`bg-white p-5 rounded-xl border shadow-sm ${
              lesson.category === 0
                ? 'border-amber-200 bg-amber-50/30'
                : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ID: {lesson.id}{' '}
                  {lesson.category === 0 && (
                    <span className="text-amber-600 ml-2">(Deactivated)</span>
                  )}
                </span>
                <h3 className="font-bold text-slate-900">{lesson.name}</h3>
              </div>
              <span className="text-lg font-black text-blue-600">
                ${Number(lesson.regularPrice ?? 0).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex gap-4">
                <Link
                  href={`/admin/lessons?view=${lesson.id}`}
                  className="text-sm font-bold text-blue-600"
                >
                  View
                </Link>
                <Link
                  href={`/admin/lessons/${lesson.id}`}
                  className="text-sm font-bold text-emerald-600"
                >
                  Edit
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <AdminToggleStatus
                  lessonId={lesson.id}
                  currentCategory={lesson.category}
                />
                {!lesson.hasBookings ? (
                  <AdminDeleteLesson
                    lessonId={lesson.id}
                    lessonName={lesson.name}
                    onDelete={deleteLessonAction}
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-300">
                    LOCKED
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP VIEW --- */}
      <div className="hidden sm:block rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs">
                  ID
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Name
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs">
                  Price
                </th>
                <th className="p-4 font-bold text-slate-700 uppercase tracking-wider text-xs text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lessons.map((lesson) => (
                <tr
                  key={lesson.id}
                  className={`hover:bg-slate-50 transition-colors group ${
                    lesson.category === 0 ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <td className="p-4 text-slate-500">#{lesson.id}</td>
                  <td className="p-4 font-semibold text-slate-900">
                    {lesson.name}
                    {lesson.category === 0 && (
                      <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                        Hidden
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-700">
                    ${Number(lesson.regularPrice ?? 0).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-4">
                      <AdminToggleStatus
                        lessonId={lesson.id}
                        currentCategory={lesson.category}
                      />
                      <div className="h-4 w-[1px] bg-slate-200 mx-1" />
                      <Link
                        href={`/admin/lessons?view=${lesson.id}`}
                        className="text-blue-600 font-medium"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/lessons/${lesson.id}`}
                        className="text-emerald-600 font-medium"
                      >
                        Edit
                      </Link>
                      {!lesson.hasBookings ? (
                        <AdminDeleteLesson
                          lessonId={lesson.id}
                          lessonName={lesson.name}
                          onDelete={deleteLessonAction}
                        />
                      ) : (
                        <span
                          className="text-[10px] font-bold text-slate-400 cursor-help"
                          title="Active bookings present"
                        >
                          LOCKED
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
