/* eslint-disable @next/next/no-img-element */
import { signInAction } from '../_lib/actions';

function SignInButton() {
  return (
    <form action={signInAction} className="w-full">
      <button className="flex items-center justify-center gap-3 md:gap-6 text-sm md:text-lg border border-slate-200 rounded-xl px-4 md:px-10 py-4 font-semibold w-full transition-all hover:bg-blue-50 hover:border-blue-200 active:scale-[0.98] bg-white text-slate-700 shadow-sm">
        <img
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          height="24"
          width="24"
          className="shrink-0 w-5 h-5 md:w-6 md:h-6"
        />

        {/* Removed 'truncate' and added 'leading-tight' */}
        <span className="leading-tight">Continue with Gmail</span>
      </button>
    </form>
  );
}

export default SignInButton;
