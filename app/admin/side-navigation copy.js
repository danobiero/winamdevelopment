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
  CalendarIcon, // ⭐ NEW ICON
} from '@heroicons/react/24/solid';

const navLinks = [
  {
    name: 'Lessons',
    href: '/admin/lessons',
    icon: <BookOpenIcon className="h-5 w-5 text-blue-950" />,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: <CalendarDaysIcon className="h-5 w-5 text-blue-950" />,
  },
  {
    name: 'Calendar', // ⭐ NEW PAGE
    href: '/admin/calendar',
    icon: <CalendarIcon className="h-5 w-5 text-blue-950" />, // ⭐ NEW ICON
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: <CreditCardIcon className="h-5 w-5 text-blue-950" />,
  },
  {
    name: 'Refunds',
    href: '/admin/refunds',
    icon: <ArrowUturnLeftIcon className="h-5 w-5 text-blue-950" />,
  },
  {
    name: 'Profile',
    href: '/admin/profile',
    icon: <UserIcon className="h-5 w-5 text-blue-950" />,
  },
];

export default function AdminSideNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-r border-primary-900 min-h-screen w-64 bg-white flex flex-col flex-shrink-0">
      <div className="px-6 py-8 flex flex-col h-full">
        <h2 className="text-2xl font-semibold mb-6 text-primary-900 text-center">
          Admin Console
        </h2>

        <ul className="flex flex-col gap-2 text-lg flex-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-4 font-semibold px-5 py-3 rounded-md transition-colors border-l-4 ${
                    isActive
                      ? 'bg-primary-50 text-primary-900 border-primary-900'
                      : 'text-primary-600 border-transparent hover:bg-logo-100 hover:text-primary-100 hover:border-primary-500'
                  }`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              </li>
            );
          })}

          {/* Mobile sign-out inline */}
          <li className="block lg:hidden">
            <SignOutButton />
          </li>
        </ul>

        {/* Desktop sign-out at bottom */}
        <div className="hidden lg:flex mt-4">
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
