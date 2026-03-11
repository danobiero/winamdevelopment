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
import Tooltip from '../calendar/_components/Tooltip';
import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

export default async function LessonsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;

  // Calculate Range
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let viewedLesson = null;
  if (viewId) {
    viewedLesson = await getLessonById(viewId);
  }

  // Fetch paginated lessons
  const lessons = await getLessons({ from, to });

  for (const lesson of lessons) {
    const result = await checkLessonHasBookings(lesson.id);
    lesson.hasBookings = result.hasBookings;
    lesson.bookingCount = result.count;
  }

  return (
    <div className="min-h-screen space-y-6 px-3 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12 sm:pb-8">
      <ToastListener />
      {viewedLesson && (
        <ViewModal
          lesson={viewedLesson.lesson}
          materials={viewedLesson.materials}
        />
      )}

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lessons <span className="text-blue-600">Catalog</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            Displaying {lessons.length} Results
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tooltip text={'Create a new lesson'}>
            <Link
              href="/admin/lessons/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-sm active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create</span>
            </Link>
          </Tooltip>

          <Tooltip text={'Upload lesson materials'}>
            <Link
              href="/admin/lessons/upload"
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition shadow-sm active:scale-95"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              <span>Upload</span>
            </Link>
          </Tooltip>

          <Tooltip text={'Manage lesson images'}>
            <Link
              href="/admin/lessons/uploadImage"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition shadow-sm active:scale-95"
            >
              <PhotoIcon className="h-4 w-4" />
              <span>Images</span>
            </Link>
          </Tooltip>
        </div>
      </div>

      {/* --- RESPONSIVE CARD VIEW (Grid for split screens/tablets) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className={`bg-white rounded-2xl border p-5 flex flex-col space-y-4 shadow-sm transition-colors ${
              lesson.category === 0
                ? 'border-amber-200 bg-amber-50/20'
                : 'border-slate-200'
            }`}
          >
            <div className="flex justify-between items-start border-b border-slate-50 pb-2">
              <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                ID: {lesson.id}
              </span>
              <span className="text-sm font-black text-blue-600">
                ${Number(lesson.regularPrice ?? 0).toFixed(2)}
              </span>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Lesson Name
              </p>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {lesson.name}
              </h3>
              {lesson.category === 0 && (
                <span className="inline-block mt-1 text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  Hidden
                </span>
              )}
            </div>

            <div className="w-full pt-2 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Bookings
                </p>
                <span className="text-xs font-bold text-slate-600">
                  {lesson.bookingCount} Reservations
                </span>
              </div>
              <AdminToggleStatus
                lessonId={lesson.id}
                currentCategory={lesson.category}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-50">
              <Link
                href={`/admin/lessons?view=${lesson.id}&page=${page}`}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                View
              </Link>
              <Link
                href={`/admin/lessons/${lesson.id}`}
                className="px-3 py-2 bg-white border border-slate-200 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest active:scale-95"
              >
                Edit
              </Link>
              <div className="ml-auto">
                {!lesson.hasBookings ? (
                  <AdminDeleteLesson
                    lessonId={lesson.id}
                    lessonName={lesson.name}
                    onDelete={deleteLessonAction}
                  />
                ) : (
                  <div className="px-2 py-1 text-[9px] font-black text-slate-300 border border-slate-100 rounded uppercase tracking-tighter">
                    Locked
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">
                Name
              </th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center">
                Price
              </th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lessons.map((lesson) => (
              <tr
                key={lesson.id}
                className={`hover:bg-blue-50/30 transition-colors group ${lesson.category === 0 ? 'bg-amber-50/10' : ''}`}
              >
                <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold">
                  #{lesson.id}
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">
                  {lesson.name}
                </td>
                <td className="px-6 py-4 text-center font-black text-slate-900">
                  ${Number(lesson.regularPrice ?? 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <AdminToggleStatus
                      lessonId={lesson.id}
                      currentCategory={lesson.category}
                    />
                    <Link
                      href={`/admin/lessons?view=${lesson.id}&page=${page}`}
                      className="text-blue-600 font-black uppercase text-[10px]"
                    >
                      View
                    </Link>
                    <Link
                      href={`/admin/lessons/${lesson.id}`}
                      className="text-emerald-600 font-black uppercase text-[10px]"
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
                      <span className="text-[9px] font-black text-slate-300 uppercase">
                        Locked
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Container - Forces the buttons to the edges */}
      <div className="pt-8 w-full">
        <PaginationControls
          page={page}
          hasNext={lessons.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}
