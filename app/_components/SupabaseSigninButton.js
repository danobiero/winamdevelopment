'use client'; // Required if using useFormStatus

import { useFormStatus } from 'react-dom';
import { emailSignInAction } from '../_lib/actions';

// Note: Metadata must be in a separate Server Component file
// if this becomes a Client Component.

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className="flex items-center justify-center gap-4 md:gap-6 text-base md:text-lg border border-primary-300 px-4 md:px-10 py-4 font-medium w-full transition-all hover:bg-primary-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-100"
    >
      <img
        src="https://www.svgrepo.com/show/532997/login.svg" // Updated link
        alt="Email login icon"
        height="24"
        width="24"
        className={`shrink-0 ${pending ? 'animate-pulse' : ''}`}
      />
      <span className="truncate">
        {pending ? 'Signing in...' : 'Student - Sign in with Email'}
      </span>
    </button>
  );
}

function SupabaseSignInButton() {
  return (
    <form action={emailSignInAction} className="w-full space-y-4">
      <div>
        <input
          name="email"
          type="email"
          required
          placeholder="Enter your email"
          className="w-full border border-primary-300 px-4 md:px-6 py-3 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      <div>
        <input
          name="password"
          type="password"
          required
          placeholder="Enter your password"
          className="w-full border border-primary-300 px-4 md:px-6 py-3 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      <SubmitButton />
    </form>
  );
}

export default SupabaseSignInButton;
