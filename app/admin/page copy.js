
import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/solid';

const adminCards = [
  {
    name: 'Lessons',
    href: '/admin/lessons',
    icon: BookOpenIcon,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: CalendarDaysIcon,
  },
  {
    name: 'Calendar',
    href: '/admin/calendar',
    icon: CalendarIcon,
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCardIcon,
  },
  {
    name: 'Refunds',
    href: '/admin/refunds',
    icon: ArrowUturnLeftIcon,
  },
  {
    name: 'Profile',
    href: '/admin/profile',
    icon: UserIcon,
  },
];

export default async function AdminHomePage() {
  // 1️⃣ Get the active session
    const session = await auth();
  
    // 2️⃣ Protect route: allow only if adminId exists
    if (!session?.user?.adminId) {
      // No adminId found → redirect to admin login
      redirect('/admin/login');
    }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8 sm:px-6 lg:px-10">
      {/* Header Card */}
      <div className="max-w-7xl mx-auto mb-10 px-4 sm:px-0">
        <div
          className="
    w-full
    rounded-xl
    bg-logo-10
    shadow-sm
    border
    border-gray-200
    px-6
    py-8
    sm:px-10
    text-center
  "
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Admin Console
          </h2>
        </div>
      </div>

      {/* Card Grid */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className="
              group
              rounded-xl
              bg-emerald-700
              p-6
              text-white
              shadow-sm
              transition-all
              duration-200
              hover:bg-blue-600
              hover:shadow-lg
              focus:outline-none
              focus:ring-2
              focus:ring-blue-500
              focus:ring-offset-2
            "
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white/20 p-3">
                <Icon className="h-6 w-6 text-white" />
              </div>

              <h2 className="text-xl font-semibold">{name}</h2>
            </div>

            <p className="mt-4 text-sm text-white/90">
              Open {name.toLowerCase()} management
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
