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
  LifebuoyIcon,
} from '@heroicons/react/24/solid';

export default function AdminSideNavigation({ supportCount = 0 }) {
  const pathname = usePathname();

  const navLinks = [
    {
      name: 'Support',
      href: '/admin/support',
      icon: <LifebuoyIcon className="h-5 w-5" />,
      badge: supportCount,
    },
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

  return (
    <>
      {/* DESKTOP */}
      <nav className="hidden lg:flex border-r border-primary-100 min-h-screen w-64 bg-white flex-col flex-shrink-0 sticky top-0">
        {/* Changed py-8 to pt-4 pb-8 to reduce top gap */}
        <div className="px-6 pt-4 pb-8 flex flex-col h-full">
          {/* Changed mb-8 to mb-4 to bring links closer to the title */}
          <h2 className="text-xl font-bold mb-4 text-primary-900 px-5">
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
                    className={`flex items-center justify-between px-5 py-3 rounded-xl font-semibold transition-all ${
                      isActive
                        ? 'bg-primary-900 text-white shadow-md'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={isActive ? 'text-white' : 'text-primary-400'}
                      >
                        {link.icon}
                      </span>
                      <span>{link.name}</span>
                    </div>

                    {link.badge > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
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

      {/* MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 z-50 px-2 pb-safe">
        <ul className="flex justify-around items-center h-16">
          {navLinks.slice(0, 5).map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <li key={link.name} className="flex-1 relative">
                <Link
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-colors ${
                    isActive ? 'text-primary-900' : 'text-primary-400'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg ${isActive ? 'bg-primary-50' : ''}`}
                  >
                    {link.icon}
                  </div>

                  {link.badge > 0 && (
                    <span className="absolute top-1 right-3 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {link.badge}
                    </span>
                  )}

                  <span className="text-[10px] font-bold uppercase tracking-tighter">
                    {link.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
