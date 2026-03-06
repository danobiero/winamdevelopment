'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SignOutButton from './SignOutButton';

export default function Navigation({ session, isMobile, onClick }) {
  const pathname = usePathname();
  const dashboardLink = session?.user?.adminId ? '/admin' : '/account';

  // Helper for active link styling
  const linkStyles = (path) => `
    relative transition-all duration-300 font-medium
    ${pathname === path ? 'text-blue-600' : 'text-slate-700 hover:text-blue-600'}
    ${isMobile ? 'text-2xl py-2' : 'text-base lg:text-lg'}
  `;

  return (
    <nav className="z-10">
      <ul
        className={`flex ${
          isMobile
            ? 'flex-col gap-8 items-start px-4'
            : 'flex-row gap-10 lg:gap-14 items-center'
        }`}
      >
        {/* Navigation Links with animated underline effect on desktop */}
        {[
          { name: 'Lessons', href: '/lessons' },
          { name: 'About Us', href: '/about' },
          { name: 'Support', href: '/support' },
        ].map((link) => (
          <li key={link.href} className="group">
            <Link
              href={link.href}
              className={linkStyles(link.href)}
              onClick={onClick}
            >
              {link.name}
              {!isMobile && (
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-blue-600 transition-all duration-300 ${pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'}`}
                />
              )}
            </Link>
          </li>
        ))}

        {/* User Account / Login Section */}
        <li
          className={`${isMobile ? 'w-full pt-4 border-t border-slate-100' : ''}`}
        >
          {session?.user?.image ? (
            <Link
              href={dashboardLink}
              className={`flex items-center gap-3 px-4 py-2 rounded-full transition-all ${
                isMobile
                  ? 'bg-slate-50'
                  : 'hover:bg-blue-50 border border-transparent hover:border-blue-100'
              }`}
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
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Dashboard
                </span>
              </div>
            </Link>
          ) : (
            <Link
              href="/account"
              className={`font-bold px-6 py-2.5 rounded-full transition-all ${
                isMobile
                  ? 'bg-blue-600 text-white w-full text-center block'
                  : 'bg-slate-900 text-white hover:bg-blue-600 shadow-md shadow-slate-200'
              }`}
              onClick={onClick}
            >
              Login
            </Link>
          )}
        </li>

        {session?.user && (
          <li className={isMobile ? 'w-full' : ''}>
            <SignOutButton isMobile={isMobile} onSignOut={onClick} />
          </li>
        )}
      </ul>
    </nav>
  );
}
