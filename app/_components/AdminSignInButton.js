import { adminSignInAction } from '../_lib/actions';

export default function AdminSignInButton() {
  return (
    /* w-full on the form ensures the button can fill the parent container */
    <form action={adminSignInAction} className="w-full">
      <button className="flex items-center justify-center gap-4 md:gap-6 text-base md:text-lg border border-primary-300 px-4 md:px-10 py-4 font-medium w-full transition-all hover:bg-primary-50 active:scale-[0.98]">
        <img
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          height="24"
          width="24"
          className="shrink-0"
        />
        <span className="truncate">Admin - Continue with Google</span>
      </button>
    </form>
  );
}
