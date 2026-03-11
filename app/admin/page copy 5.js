import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  CalendarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const adminCards = [
  {
    name: 'Lessons',
    href: '/admin/lessons',
    icon: BookOpenIcon,
    description: 'Manage lesson content',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: CalendarDaysIcon,
    description: 'Track student reservations',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  {
    name: 'Calendar',
    href: '/admin/calendar',
    icon: CalendarIcon,
    description: 'Master view of all sessions',
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCardIcon,
    description: 'Review transactions and revenue',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    name: 'Refunds',
    href: '/admin/refunds',
    icon: ArrowUturnLeftIcon,
    description: 'Process and track refund requests',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-700',
  },
  {
    name: 'Profile',
    href: '/admin/profile',
    icon: UserIcon,
    description: 'Update your administrative settings',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
];

export default async function AdminHomePage() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin/login');
  }

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Decorative Blobs */}
      <div className="absolute -top-32 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute -top-32 -right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 px-4 pt-0 pb-2 sm:pb-4 lg:px-10">
        {/* Header Card: Changed mt-1 to mt-2 and refined py for a better vertical balance */}
        <div className="max-w-7xl mx-auto mt-2 mb-4 sm:mb-6">
          <div className="w-full rounded-xl bg-logo-10 shadow-sm border border-gray-200 px-5 py-4 sm:px-10 sm:py-6 text-center backdrop-blur-sm transition-all hover:shadow-md hover:border-gray-300">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Admin Console
            </h2>
            <p className="text-slate-500 mt-1 text-xs sm:text-base">
              Logged in as{' '}
              <span className="font-semibold">{session.user.name}</span>
            </p>
          </div>
        </div>

        {/* Card Grid */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {adminCards.map(
            ({
              name,
              href,
              icon: Icon,
              description,
              color,
              lightColor,
              textColor,
            }) => (
              <Link
                key={name}
                href={href}
                /* Added hover:-translate-y-1 for a smoother, less "stiff" interactive feel */
                className="group relative flex flex-row sm:flex-col items-center sm:items-start bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-sm transition-all duration-300 active:scale-95 sm:active:scale-100 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 sm:hidden ${color}`}
                ></div>

                <div className="flex-shrink-0 relative z-20">
                  <div
                    className={`p-3 sm:p-4 rounded-xl ${lightColor} ${textColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                </div>

                <div className="ml-4 sm:ml-0 sm:mt-8 flex-grow relative z-20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 transition-colors group-hover:text-black">
                      {name}
                    </h3>
                    <ChevronRightIcon
                      className={`h-5 w-5 ${textColor} sm:opacity-0 sm:-translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`}
                    />
                  </div>
                  <p className="hidden sm:block mt-2 text-slate-500 text-sm leading-relaxed line-clamp-2">
                    {description}
                  </p>
                </div>

                <div className="hidden sm:flex mt-auto pt-6 items-center text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                  Open Dashboard
                </div>
              </Link>
            )
          )}
        </section>
      </div>
    </main>
  );
}
