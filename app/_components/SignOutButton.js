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
      className={isMobile ? '' : 'w-full'}
    >
      <button
        type="submit"
        disabled={pending}
        className={`
          flex items-center transition-all duration-200
          ${
            isMobile
              ? 'flex-col gap-1 text-primary-400 active:scale-90'
              : 'flex-row gap-4 w-full py-3 px-5 text-lg font-semibold text-primary-600 hover:bg-primary-900 hover:text-primary-100 rounded-lg'
          }
          ${pending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <ArrowRightOnRectangleIcon
          className={isMobile ? 'h-6 w-6' : 'h-5 w-5'}
        />
        <span className={isMobile ? 'text-[10px] font-bold uppercase' : ''}>
          {pending ? '...' : 'Log out'}
        </span>
      </button>
    </form>
  );
}

export default SignOutButton;
