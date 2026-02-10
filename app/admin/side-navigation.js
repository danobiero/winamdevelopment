'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/app/_components/SignOutButton';
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  CalendarIcon,
  Bars3Icon, // For mobile menu toggle if needed
} from '@heroicons/react/24/solid';

const navLinks = [
  {
    name: 'Lessons',
    href: '/admin/lessons',
    icon: <BookOpenIcon className="h-5 w-5" />,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: <CalendarDaysIcon className="h-5 w-5" />,
  },
  {
    name: 'Calendar',
    href: '/admin/calendar',
    icon: <CalendarIcon className="h-5 w-5" />,
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
  {
    name: 'Refunds',
    href: '/admin/refunds',
    icon: <ArrowUturnLeftIcon className="h-5 w-5" />,
  },
  {
    name: 'Profile',
    href: '/admin/profile',
    icon: <UserIcon className="h-5 w-5" />,
  },
];

export default function AdminSideNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <nav className="hidden lg:flex border-r border-primary-100 min-h-screen w-64 bg-white flex-col flex-shrink-0 sticky top-0">
        <div className="px-6 py-8 flex flex-col h-full">
          <h2 className="text-xl font-bold mb-8 text-primary-900 px-5">
            Admin Console
          </h2>

          <ul className="flex flex-col gap-2 flex-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + '/');

              return (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-4 font-semibold px-5 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary-900 text-white shadow-md'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                    }`}
                  >
                    <span
                      className={isActive ? 'text-white' : 'text-primary-400'}
                    >
                      {link.icon}
                    </span>
                    <span>{link.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-auto border-t border-primary-50 pt-4">
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      {/* Visible only on small/medium screens */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 z-50 px-2 pb-safe">
        <ul className="flex justify-around items-center h-16">
          {navLinks.slice(0, 5).map((link) => {
            // Showing first 5 for spacing
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <li key={link.name} className="flex-1">
                <Link
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                    isActive ? 'text-primary-900' : 'text-primary-400'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-primary-50' : ''}`}
                  >
                    {link.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {link.name}
                  </span>
                </Link>
              </li>
            );
          })}
          {/* Profile/More link for mobile */}
          <li className="flex-1">
            <Link
              href="/admin/profile"
              className={`flex flex-col items-center justify-center gap-1 h-full ${
                pathname.startsWith('/admin/profile')
                  ? 'text-primary-900'
                  : 'text-primary-400'
              }`}
            >
              <UserIcon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                Me
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}
