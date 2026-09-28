'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from '@/app/_components/SignOutButton';
import ThemeToggle from '@/app/_components/ThemeToggle';

import {
  BookOpenIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  UserIcon,
  CalendarIcon,
  LifebuoyIcon,
  ChartBarIcon,
  DocumentPlusIcon,
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/solid';

export default function AdminSideNavigation({ supportCount = 0 }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const navCategories = [
    {
      category: 'Administration',
      icon: <ShieldCheckIcon className="h-5 w-5" />,
      colorClasses:
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25',
      items: [
        {
          name: 'Applications',
          href: '/admin/applications',
          icon: <DocumentPlusIcon className="h-5 w-5" />,
        },
        {
          name: 'Legacy Registry',
          href: '/admin/legacy',
          icon: <UserGroupIcon className="h-5 w-5" />,
        },
        {
          name: 'Support',
          href: '/admin/support',
          icon: <LifebuoyIcon className="h-5 w-5" />,
          badge: supportCount,
        },
      ],
    },
    {
      category: 'Business',
      icon: <BriefcaseIcon className="h-5 w-5" />,
      colorClasses:
        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm shadow-amber-500/25',
      items: [
        {
          name: 'Opportunities',
          href: '/admin/opportunities',
          icon: <BookOpenIcon className="h-5 w-5" />,
        },
        {
          name: 'Calendar',
          href: '/admin/calendar',
          icon: <CalendarIcon className="h-5 w-5" />,
        },
        {
          name: 'Reports',
          href: '/admin/reports',
          icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        },
      ],
    },
    {
      category: 'Finance',
      icon: <BanknotesIcon className="h-5 w-5" />,
      colorClasses:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25',
      items: [
        {
          name: 'Investments',
          href: '/admin/investments',
          icon: <ChartBarIcon className="h-5 w-5" />,
        },
        {
          name: 'Transactions',
          href: '/admin/transactions',
          icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
        },
        {
          name: 'Payments',
          href: '/admin/payments',
          icon: <CreditCardIcon className="h-5 w-5" />,
        },
        {
          name: 'Redemptions',
          href: '/admin/redemptions',
          icon: <ArrowUturnLeftIcon className="h-5 w-5" />,
        },
        {
          name: 'Reports',
          href: '/admin/finance-reports',
          icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        },
        {
          name: 'Valuations',
          href: '/admin/finance-reports/valuations',
          icon: <ChartBarIcon className="h-5 w-5" />,
        },
      ],
    },
    {
      category: 'System',
      icon: <Cog6ToothIcon className="h-5 w-5" />,
      colorClasses:
        'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-sm shadow-purple-500/25',
      items: [
        {
          name: 'Profile',
          href: '/admin/profile',
          icon: <UserIcon className="h-5 w-5" />,
        },
      ],
    },
  ];

  const allNavLinks = Array.from(
    new Map(
      navCategories
        .flatMap((group) => group.items)
        .map((item) => [item.href, item])
    ).values()
  );

  // Initialize with the category that matches current route open
  const [openCategories, setOpenCategories] = useState(() => {
    const initial = {};
    navCategories.forEach((group) => {
      const hasActive = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (hasActive) {
        initial[group.category] = true;
      }
    });
    return initial;
  });

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <nav className="hidden lg:flex border-r border-slate-200 dark:border-slate-800 h-full w-64 bg-white dark:bg-slate-900 flex-col flex-shrink-0 transition-colors duration-200">
        <div className="px-5 pt-6 pb-8 flex flex-col h-full overflow-hidden">
          {/* Header - flex-none keeps it from shrinking */}
          <div className="flex-none">
            <h2 className="text-xl font-bold mb-6 text-primary-900 dark:text-white px-2 tracking-tight">
              Admin Console
            </h2>
          </div>

          {/* Nav List - flex-1 and overflow-y-auto allows only this section to scroll */}
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {navCategories.map((group) => {
              const isOpen = Boolean(openCategories[group.category]);
              const groupBadge = group.items.reduce(
                (sum, item) => sum + (item.badge || 0),
                0
              );

              return (
                <div key={group.category} className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.category)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer shadow-sm hover:brightness-105 active:scale-[0.99] ${group.colorClasses}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="opacity-95">{group.icon}</span>
                      <span className="tracking-wide">{group.category}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {groupBadge > 0 && !isOpen && (
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ring-2 ring-white">
                          {groupBadge}
                        </span>
                      )}
                      <ChevronDownIcon
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <ul className="flex flex-col gap-1 pl-2 pt-1 border-l-2 border-slate-100 dark:border-slate-800 ml-3">
                      {group.items.map((link) => {
                        const isActive =
                          pathname === link.href ||
                          pathname.startsWith(link.href + '/');

                        return (
                          <li key={`${group.category}-${link.name}`} className="group flex-none">
                            <Link
                              href={link.href}
                              className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-primary-900 dark:bg-blue-600 text-white shadow-md shadow-primary-900/20 translate-x-1'
                                  : 'text-primary-600 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-slate-800 hover:text-primary-900 dark:hover:text-white hover:pl-5'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`transition-transform duration-200 group-hover:scale-110 ${
                                    isActive ? 'text-white' : 'text-primary-400 dark:text-slate-400'
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
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer/Theme/Logout - flex-none and mt-auto locks it to the bottom */}
          <div className="flex-none mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 bg-white dark:bg-slate-900 transition-colors duration-200">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t-2 border-slate-200/90 dark:border-slate-800 z-50 px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-colors duration-200">
        <ul className="flex justify-around items-center h-16">
          {allNavLinks.slice(0, 5).map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + '/');

            return (
              <li key={link.name} className="flex-1 relative">
                <Link
                  href={link.href}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-all duration-300 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 scale-105 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-colors duration-300 relative ${
                      isActive ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-bold shadow-sm shadow-blue-500/20' : ''
                    }`}
                  >
                    {link.icon}
                    {link.badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs font-bold px-1.5 rounded-full shadow-sm">
                        {link.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold uppercase tracking-tight truncate max-w-[65px]">
                    {link.name}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* More Menu Trigger */}
          <li className="flex-1 relative">
            <button
              onClick={() => setIsMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-1 w-full h-full text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-all cursor-pointer"
            >
              <div className="p-1.5 rounded-lg relative">
                <Bars3Icon className="h-5 w-5" />
                {supportCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-xs font-bold px-1.5 rounded-full shadow-sm">
                    {supportCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-tight">
                More
              </span>
            </button>
          </li>
        </ul>
      </nav>

      {/* MOBILE MORE DRAWER */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl p-6 space-y-5 max-h-[80vh] overflow-y-auto shadow-2xl z-10 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Admin Navigation
              </h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              {navCategories.map((group) => {
                const isOpen = Boolean(openCategories[group.category]);
                const groupBadge = group.items.reduce(
                  (sum, item) => sum + (item.badge || 0),
                  0
                );

                return (
                  <div key={group.category} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleCategory(group.category)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm cursor-pointer ${group.colorClasses}`}
                    >
                      <div className="flex items-center gap-3">
                        <span>{group.icon}</span>
                        <span>{group.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {groupBadge > 0 && !isOpen && (
                          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {groupBadge}
                          </span>
                        )}
                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {group.items.map((link) => {
                          const isActive =
                            pathname === link.href ||
                            pathname.startsWith(link.href + '/');

                          return (
                            <Link
                              key={`drawer-${group.category}-${link.name}`}
                              href={link.href}
                              onClick={() => setIsMoreOpen(false)}
                              className={`flex items-center gap-2.5 p-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span
                                className={
                                  isActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                                }
                              >
                                {link.icon}
                              </span>
                              <span className="truncate">{link.name}</span>
                              {link.badge > 0 && (
                                <span className="ml-auto bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                  {link.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
