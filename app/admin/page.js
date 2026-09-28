import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BookOpenIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const adminCards = [
  {
    name: 'Opportunities',
    href: '/admin/opportunities',
    icon: BookOpenIcon,
    description: 'Manage opportunities content',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    name: 'Investments',
    href: '/admin/investments',
    icon: ChartBarIcon,
    description: 'Track shareholder investments',
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
    name: 'Redemptions',
    href: '/admin/redemptions',
    icon: ArrowUturnLeftIcon,
    description: 'Process capital withdrawal requests',
    color: 'bg-rose-500',
    lightColor: 'bg-rose-50',
    textColor: 'text-rose-700',
  },
  {
    name: 'Reports',
    href: '/admin/finance-reports',
    icon: ClipboardDocumentListIcon,
    description: 'View financial statements and reports',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
];

export default async function AdminHomePage() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  return (
    <div className="bg-slate-50 relative overflow-x-hidden w-full h-full">
      {/* Decorative Blobs */}
      <div className="absolute -top-32 -left-20 w-64 h-64 sm:w-96 sm:h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -top-32 -right-20 w-64 h-64 sm:w-96 sm:h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 px-4 py-4 sm:py-6 lg:px-10">
        {/* SLIM HEADER SECTION */}
        <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
          <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Admin <span className="text-blue-600">Console</span>
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-[0.2em] font-bold mt-1">
                Management Dashboard
              </p>
            </div>

            <div className="mt-2 sm:mt-0 flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm w-fit">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-slate-600 text-xs font-medium">
                {session.user.name}
              </p>
            </div>
          </div>
        </div>

        {/* Card Grid */}
        <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-24 sm:pb-10">
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
                className="group relative flex flex-row sm:flex-col items-center sm:items-start bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm transition-all active:scale-95 hover:shadow-lg overflow-hidden"
              >
                {/* Visual Accent */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 sm:hidden ${color}`}
                ></div>

                {/* Icon */}
                <div className="flex-shrink-0 relative z-20">
                  <div
                    className={`p-2.5 sm:p-3 rounded-xl ${lightColor} ${textColor} transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>

                {/* Text */}
                <div className="ml-4 sm:ml-0 sm:mt-5 flex-grow relative z-20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                      {name}
                    </h3>
                    <ChevronRightIcon
                      className={`h-4 w-4 ${textColor} sm:opacity-0 sm:-translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`}
                    />
                  </div>
                  <p className="hidden sm:block mt-1 text-slate-500 text-xs leading-relaxed line-clamp-1 font-medium">
                    {description}
                  </p>
                </div>

                <div className="hidden sm:flex mt-5 pt-4 border-t border-slate-50 items-center text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                  Go to {name}
                </div>
              </Link>
            )
          )}
        </section>
      </div>
    </div>
  );
}
