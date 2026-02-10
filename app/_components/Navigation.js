'use client';

import Link from 'next/link';
import Image from 'next/image';
import SignOutButton from './SignOutButton';

export default function Navigation({ session, isMobile, onClick }) {
  const dashboardLink = session?.user?.adminId ? '/admin' : '/account';

  return (
    <nav className="z-10 text-base sm:text-xl">
      <ul
        /* On mobile, we stack links. On desktop, they stay in a row. */
        className={`flex ${
          isMobile
            ? 'flex-col gap-6 items-start'
            : 'flex-row gap-16 items-center'
        }`}
      >
        <li>
          <Link
            href="/lessons"
            className="text-blue-950 hover:text-logo-100 transition-colors"
            onClick={onClick} // Closes MobileMenu when clicked
          >
            Lessons
          </Link>
        </li>

        <li>
          {session?.user?.image ? (
            <Link
              href={dashboardLink}
              className="text-blue-950 hover:text-logo-100 transition-colors flex items-center gap-3"
              onClick={onClick}
            >
              <div className="relative w-8 h-8">
                <Image
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  fill
                  className="rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="truncate max-w-[150px]">
                {session.user.name}
              </span>
            </Link>
          ) : (
            <Link
              href="/account"
              className="text-blue-950 hover:text-logo-100 transition-colors"
              onClick={onClick}
            >
              Login
            </Link>
          )}
        </li>

        {session?.user && (
          <li>
            {/* Don't wrap in a div with onClick. Instead, pass the onClick 
       to the button so it can handle both: closing the menu AND signing out.
    */}
            <SignOutButton isMobile={isMobile} onSignOut={onClick} />
          </li>
        )}
      </ul>
    </nav>
  );
}
