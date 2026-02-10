'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { signOutAction } from '../_lib/actions';
import { useFormStatus } from 'react-dom';

function SignOutButton({ isMobile }) {
  const { pending } = useFormStatus();

  return (
    <form action={signOutAction} className={isMobile ? '' : 'w-full'}>
      <button
        disabled={pending}
        className={`
          flex flex-col items-center transition-all duration-200
          ${
            isMobile
              ? 'gap-1 text-primary-400 active:scale-90'
              : 'flex-row gap-4 w-full py-3 px-5 text-lg font-semibold text-primary-600 hover:bg-primary-900 hover:text-primary-100 rounded-lg'
          }
          ${pending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* Icon size stays consistent with nav links */}
        <ArrowRightOnRectangleIcon
          className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5 text-blue-950 group-hover:text-primary-100'}`}
        />

        {/* Label logic: Uppercase small text for Mobile Tabs, Regular text for Sidebar */}
        <span className={isMobile ? 'text-[10px] font-bold uppercase' : ''}>
          {pending ? '...' : 'Log out'}
        </span>
      </button>
    </form>
  );
}

export default SignOutButton;
