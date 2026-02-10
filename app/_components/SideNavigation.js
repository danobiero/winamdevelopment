'use client';

import {
  CalendarDaysIcon,
  HomeIcon,
  UserIcon,
} from '@heroicons/react/24/solid';
import SignOutButton from './SignOutButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Home', href: '/account', icon: <HomeIcon className="h-6 w-6" /> },
  {
    name: 'Lessons',
    href: '/account/reservations',
    icon: <CalendarDaysIcon className="h-6 w-6" />,
  },
  {
    name: 'Profile',
    href: '/account/profile',
    icon: <UserIcon className="h-6 w-6" />,
  },
];

function SideNavigation({ isMobile }) {
  const pathname = usePathname();

  // MOBILE VIEW: Bottom Tab Bar (Fixed to bottom of viewport)
  if (isMobile) {
    return (
      <nav className="flex justify-around items-center h-16 px-2 bg-white">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
                isActive ? 'text-blue-950' : 'text-primary-400'
              }`}
            >
              {/* Responsive icon container */}
              <div
                className={`${isActive ? 'scale-110' : ''} transition-transform`}
              >
                {link.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {link.name}
              </span>
            </Link>
          );
        })}

        <div className="flex-1 flex justify-center">
          <SignOutButton isMobile={true} />
        </div>
      </nav>
    );
  }

  // DESKTOP VIEW: Sidebar (Fixed to left side)
  return (
    <nav className="h-full flex flex-col bg-white">
      <ul className="flex flex-col gap-2 p-4 text-lg flex-1">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <li key={link.name}>
              <Link
                href={link.href}
                className={`py-3 px-5 transition-all flex items-center gap-4 font-semibold rounded-lg ${
                  isActive
                    ? 'bg-primary-100 text-blue-950 shadow-sm'
                    : 'text-primary-600 hover:bg-primary-50 hover:translate-x-1'
                }`}
              >
                <span className="text-blue-950">{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto p-4 border-t border-primary-50">
        <SignOutButton isMobile={false} />
      </div>
    </nav>
  );
}

export default SideNavigation;
