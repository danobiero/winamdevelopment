'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HiMenu, HiX } from 'react-icons/hi';
import Image from 'next/image';
import SignOutButton from './SignOutButton';

export default function Navigation({ session }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const dashboardLink = session?.user?.adminId ? '/admin' : '/account';

  return (
    <nav className="z-10 text-base sm:text-xl relative">
      {/* Hamburger menu for mobile */}
      <button
        onClick={toggleMenu}
        className="sm:hidden text-blue-950 focus:outline-none"
        aria-label="Toggle menu"
      >
        {isOpen ? <HiX size={28} /> : <HiMenu size={28} />}
      </button>

      {/* Menu list */}
      <ul
        className={`flex flex-col sm:flex-row gap-6 sm:gap-16 items-start sm:items-center mt-4 sm:mt-0 ${
          isOpen ? 'block' : 'hidden'
        } sm:flex`}
      >
        <li>
          <Link
            href="/lessons"
            className="hover:text-logo-100 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Lessons
          </Link>
        </li>

        <li>
          {session?.user?.image ? (
            <Link
              href={dashboardLink} // 👈 ADMIN → /admin, STUDENT → /account
              className="hover:text-logo-100 transition-colors flex items-center gap-3"
              onClick={() => setIsOpen(false)}
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
              <span className="truncate max-w-[120px] sm:max-w-none">
                {session.user.name}
              </span>
            </Link>
          ) : (
            <Link
              href="/account"
              className="hover:text-logo-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          )}
        </li>

        {session?.user && (
          <li>
            <div onClick={() => setIsOpen(false)}>
              <SignOutButton />
            </div>
          </li>
        )}
      </ul>
    </nav>
  );
}
