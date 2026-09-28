'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';
import {
  SparklesIcon,
  InformationCircleIcon,
  LifebuoyIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

export default function Navigation({ session, isMobile, onClick }) {
  const pathname = usePathname();
  const dashboardLink = session?.user?.adminId ? '/admin' : '/account';

  const navLinks = [
    {
      name: 'Opportunities',
      href: '/opportunities',
      icon: <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />,
    },
    {
      name: 'About',
      href: '/about',
      icon: <InformationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />,
    },
    {
      name: 'Support',
      href: '/support',
      icon: <LifebuoyIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />,
    },
  ];

  if (isMobile) {
    return (
      <nav className="w-full">
        <ul className="flex flex-col gap-1 w-full">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm sm:text-base transition-colors w-full font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                      : 'text-slate-800 hover:text-blue-700 hover:bg-blue-50/70'
                  }`}
                >
                  <span className={`shrink-0 ${isActive ? '[&>svg]:text-white' : ''}`}>{link.icon}</span>
                  <span className="truncate">{link.name}</span>
                  {isActive && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-white shrink-0 shadow-xs" />
                  )}
                </Link>
              </li>
            );
          })}

          {/* User Account / Dashboard */}
          <li className="pt-2 mt-1.5 border-t border-slate-100">
            {session?.user ? (
              <Link
                href={dashboardLink}
                onClick={onClick}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/70 transition-colors w-full bg-slate-50/60 border border-slate-100"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-blue-200">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {session.user.name?.split(' ')[0] || 'Account'}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-blue-600 font-bold">
                    Dashboard
                  </span>
                </div>
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-blue-600 shrink-0" />
              </Link>
            ) : (
              <Link
                href="/account"
                onClick={onClick}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wider rounded-xl text-center block shadow-md shadow-blue-500/25 transition-colors"
              >
                Login
              </Link>
            )}
          </li>

          {/* Log Out Button */}
          {session?.user && (
            <li className="pt-0.5">
              <SignOutButton isMobile={true} onSignOut={onClick} />
            </li>
          )}
        </ul>
      </nav>
    );
  }

  // DESKTOP NAVIGATION
  const linkStyles = (path) => `
    relative transition-all duration-300 font-medium
    ${pathname === path ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}
    text-base lg:text-lg
  `;

  return (
    <nav className="z-10">
      <ul className="flex flex-row gap-10 lg:gap-14 items-center">
        {navLinks.map((link) => (
          <li key={link.href} className="group">
            <Link
              href={link.href}
              className={linkStyles(link.href)}
              onClick={onClick}
            >
              {link.name}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${
                  pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
              />
            </Link>
          </li>
        ))}

        {/* User Account */}
        <li>
          {session?.user?.image ? (
            <Link
              href={dashboardLink}
              className="flex items-center gap-3 px-4 py-2 rounded-full transition-all hover:bg-blue-50 border border-transparent hover:border-blue-100"
              onClick={onClick}
            >
              <div className="relative w-8 h-8 lg:w-9 lg:h-9">
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  fill
                  className="rounded-full object-cover border-2 border-white shadow-sm"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 leading-none truncate max-w-[120px]">
                  {session.user.name.split(' ')[0]}
                </span>

                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  Dashboard
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/account"
              className="font-bold px-6 py-2.5 rounded-full transition-all bg-slate-900 text-white hover:bg-blue-600 shadow-md shadow-slate-200"
              onClick={onClick}
            >
              Login
            </Link>
          )}
        </li>

        {session?.user && (
          <li>
            <SignOutButton isMobile={false} onSignOut={onClick} />
          </li>
        )}
      </ul>
    </nav>
  );
}
