'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import ThemeToggle from './ThemeToggle';

import {
  HomeIcon,
  ChartBarIcon,
  BriefcaseIcon,
  CalendarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  LifebuoyIcon,
  UserIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/solid';

const navCategories = [
  {
    category: 'Portfolio',
    icon: <BriefcaseIcon className="h-5 w-5" />,
    colorClasses:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25',
    items: [
      {
        name: 'Dashboard',
        href: '/account',
        icon: <HomeIcon className="h-5 w-5" />,
      },
      {
        name: 'My Investments',
        href: '/account/investments',
        icon: <ChartBarIcon className="h-5 w-5" />,
      },
      {
        name: 'Calendar',
        href: '/account/calendar',
        icon: <CalendarIcon className="h-5 w-5" />,
      },
    ],
  },
  {
    category: 'Reports',
    icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
    colorClasses:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm shadow-emerald-500/25',
    items: [
      {
        name: 'Payments',
        href: '/account/payment',
        icon: <CreditCardIcon className="h-5 w-5" />,
      },
      {
        name: 'Documents',
        href: '/account/documents',
        icon: <DocumentTextIcon className="h-5 w-5" />,
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
        name: 'Support',
        href: '/account/support',
        icon: <LifebuoyIcon className="h-5 w-5" />,
      },
      {
        name: 'Profile',
        href: '/account/profile',
        icon: <UserIcon className="h-5 w-5" />,
      },
    ],
  },
];

// Quick shortcuts for mobile bar (first 4 items + "More" drawer trigger)
const mobileQuickLinks = [
  {
    name: 'Dashboard',
    href: '/account',
    icon: <HomeIcon className="h-5 w-5" />,
  },
  {
    name: 'Investments',
    href: '/account/investments',
    icon: <ChartBarIcon className="h-5 w-5" />,
  },
  {
    name: 'Payments',
    href: '/account/payment',
    icon: <CreditCardIcon className="h-5 w-5" />,
  },
  {
    name: 'Documents',
    href: '/account/documents',
    icon: <DocumentTextIcon className="h-5 w-5" />,
  },
];

function isActiveRoute(pathname, href) {
  if (href === '/account') return pathname === '/account';
  return pathname === href || pathname.startsWith(href + '/');
}

function SideNavigation({ isMobile }) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize with the category that matches current route open
  const [openCategories, setOpenCategories] = useState(() => {
    const initial = {};
    navCategories.forEach((group) => {
      const hasActive = group.items.some((item) =>
        isActiveRoute(pathname, item.href)
      );
      if (hasActive) {
        initial[group.category] = true;
      }
    });
    if (Object.keys(initial).length === 0) {
      initial['Portfolio'] = true;
    }
    return initial;
  });

  // Automatically expand category when navigating to one of its child routes
  useEffect(() => {
    navCategories.forEach((group) => {
      const hasActive = group.items.some((item) =>
        isActiveRoute(pathname, item.href)
      );
      if (hasActive) {
        setOpenCategories((prev) => ({ ...prev, [group.category]: true }));
      }
    });
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen]);

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Drawer modal rendered into document.body via createPortal
  const drawerContent = (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div
        className="fixed inset-0"
        onClick={() => setIsMoreOpen(false)}
        aria-hidden="true"
      />
      <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto shadow-2xl z-10 border-t border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Account Navigation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Investor Portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMoreOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          {navCategories.map((group) => {
            const isOpen = Boolean(openCategories[group.category]);

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
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="grid grid-cols-2 gap-2 pl-2">
                    {group.items.map((link) => {
                      const isActive = isActiveRoute(pathname, link.href);

                      return (
                        <Link
                          key={`drawer-${group.category}-${link.name}`}
                          href={link.href}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl font-bold text-xs transition-all ${
                            isActive
                              ? 'bg-primary-900 dark:bg-blue-600 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={
                              isActive ? 'text-white' : 'text-primary-500 dark:text-primary-400'
                            }
                          >
                            {link.icon}
                          </span>
                          <span className="truncate">{link.name}</span>
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
          <SignOutButton
            isMobile={false}
            onSignOut={() => setIsMoreOpen(false)}
          />
        </div>
      </div>
    </div>
  );

  // MOBILE NAV
  if (isMobile) {
    const isOtherRouteActive = !mobileQuickLinks.some((link) =>
      isActiveRoute(pathname, link.href)
    );

    return (
      <>
        {/* MOBILE BOTTOM NAV BAR */}
        <nav className="flex justify-around items-center h-16 px-2 bg-white dark:bg-slate-900 transition-colors duration-200">
          {mobileQuickLinks.map((link) => {
            const isActive = isActiveRoute(pathname, link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-200 ${
                  isActive
                    ? 'text-primary-900 dark:text-blue-400 scale-105 font-bold'
                    : 'text-primary-400 dark:text-slate-400 hover:text-primary-900 dark:hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-primary-50 dark:bg-slate-800 text-primary-900 dark:text-blue-400 font-bold' : ''
                  }`}
                >
                  {link.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tighter truncate max-w-[55px]">
                  {link.name}
                </span>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all duration-200 cursor-pointer ${
              isOtherRouteActive
                ? 'text-primary-900 dark:text-blue-400 font-bold scale-105'
                : 'text-primary-400 dark:text-slate-400 hover:text-primary-900 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg transition-colors duration-200 ${
                isOtherRouteActive ? 'bg-primary-50 dark:bg-slate-800 text-primary-900 dark:text-blue-400' : ''
              }`}
            >
              <Bars3Icon className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tighter">
              More
            </span>
          </button>
        </nav>

        {/* PORTALED MOBILE MORE DRAWER */}
        {mounted && isMoreOpen && createPortal(drawerContent, document.body)}
      </>
    );
  }

  // DESKTOP SIDEBAR
  return (
    <nav className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      <div className="px-5 pt-6 pb-6 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-none mb-6 px-2">
          <h2 className="text-xl font-bold text-primary-900 dark:text-white tracking-tight">
            Investor <span className="text-blue-600 dark:text-blue-400">Portal</span>
          </h2>
          <p className="text-xs text-primary-400 dark:text-slate-400 font-medium mt-0.5">
            Shareholder Account
          </p>
        </div>

        {/* Nav List */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {navCategories.map((group) => {
            const isOpen = Boolean(openCategories[group.category]);

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
                      const isActive = isActiveRoute(pathname, link.href);

                      return (
                        <li
                          key={`${group.category}-${link.name}`}
                          className="group flex-none"
                        >
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
                                  isActive
                                    ? 'text-white'
                                    : 'text-primary-400 dark:text-slate-400'
                                }`}
                              >
                                {link.icon}
                              </span>
                              <span>{link.name}</span>
                            </div>
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

        {/* Footer/Theme/Logout */}
        <div className="flex-none mt-auto border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3 bg-white dark:bg-slate-900 transition-colors duration-200">
          <ThemeToggle />
          <SignOutButton isMobile={false} />
        </div>
      </div>
    </nav>
  );
}

export default SideNavigation;
