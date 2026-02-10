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
  {
    name: 'Home',
    href: '/account',
    icon: <HomeIcon className="h-5 w-5 text-blue-950" />,
  },
  {
    name: 'My Lessons',
    href: '/account/reservations',
    icon: <CalendarDaysIcon className="h-5 w-5 text-blue-950" />,
  },
  {
    name: 'Student Profile',
    href: '/account/profile',
    icon: <UserIcon className="h-5 w-5 text-blue-950" />,
  },
];
function SideNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-r border-primary-900 h-full">
      <ul className="flex flex-col gap-2 h-full text-lg">
        {navLinks.map((link) => (
          <li key={link.name}>
            <Link
              className={`py-3 px-5 hover:bg-primary-900 hover:text-primary-100 transition-colors flex items-center gap-4 font-semibold text-primary-600 ${
                pathname === link.href ? 'bg-primary-50' : ''
              }`}
              href={link.href}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          </li>
        ))}

        {/* For small screens -> keep inline with menu */}
        <li className="block lg:hidden">
          <SignOutButton />
        </li>
      </ul>

      {/* For big screens -> stick at bottom */}
      <div className="hidden lg:flex mt-auto p-4">
        <SignOutButton />
      </div>
    </nav>
  );
}



export default SideNavigation;
