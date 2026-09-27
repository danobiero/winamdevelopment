'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { signOutAction } from '../_lib/actions';
import { useFormStatus } from 'react-dom';

function SignOutButton({ isMobile, onSignOut }) {
  const { pending } = useFormStatus();

  return (
    <form
      action={async () => {
        await signOutAction();
        onSignOut?.(); // CLOSE MENU AFTER SIGN OUT
      }}
      className="w-full"
    >
      <button
        type="submit"
        disabled={pending}
        className={`
          flex items-center transition-all duration-200 cursor-pointer
          ${
            isMobile
              ? 'gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 w-full'
              : 'gap-4 w-full py-3 px-5 text-lg font-semibold text-primary-600 hover:bg-primary-900 hover:text-primary-100 rounded-lg'
          }
          ${pending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <ArrowRightOnRectangleIcon
          className={isMobile ? 'h-4 w-4 text-rose-500 shrink-0' : 'h-5 w-5'}
        />
        <span className={isMobile ? 'text-xs font-bold' : ''}>
          {pending ? 'Logging out...' : 'Log out'}
        </span>
      </button>
    </form>
  );
}

export default SignOutButton;
