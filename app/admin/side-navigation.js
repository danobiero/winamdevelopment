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
    {
      name: 'Support',
      href: '/admin/support',
      icon: <LifebuoyIcon className="h-5 w-5" />,
      badge: supportCount,
    },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden lg:flex border-r border-primary-100 h-full w-64 bg-white flex-col flex-shrink-0">
        <div className="px-6 pt-6 pb-8 flex flex-col h-full overflow-hidden">
          {/* Header - flex-none keeps it from shrinking */}
          <div className="flex-none">
            <h2 className="text-xl font-bold mb-6 text-primary-900 px-5 tracking-tight">
              Admin Console
            </h2>
          </div>

          {/* Nav List - flex-1 and overflow-y-auto allows only this section to scroll */}
          <ul className="flex flex-col gap-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + '/');

              return (
                <li key={link.name} className="group flex-none">
                  <Link
                    href={link.href}
                    className={`flex items-center justify-between px-5 py-3 rounded-xl font-semibold transition-all duration-300 ease-in-out ${
                      isActive
                        ? 'bg-primary-900 text-white shadow-lg shadow-primary-900/20 translate-x-1'
                        : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900 hover:pl-7'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`transition-transform duration-300 group-hover:scale-110 ${
                          isActive ? 'text-white' : 'text-primary-400'
                        }`}
                      >
                        {link.icon}
                      </span>
                      <span>{link.name}</span>
                    </div>

                    {link.badge > 0 && (
                      <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ring-2 ring-white">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Footer/Logout - flex-none and mt-auto locks it to the bottom */}
          <div className="flex-none mt-auto border-t border-primary-50 pt-4 bg-white">
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 z-50 px-2 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <ul className="flex justify-around items-center h-16">
          {navLinks.slice(0, 6).map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <li key={link.name} className="flex-1 relative">
                <Link
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-all duration-300 ${
                    isActive ? 'text-primary-900 scale-105' : 'text-primary-400'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors duration-300 ${
                      isActive ? 'bg-primary-50' : ''
                    }`}
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
        </ul>
      </nav>
    </>
  );
}
