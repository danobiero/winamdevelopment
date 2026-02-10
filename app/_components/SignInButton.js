import { signInAction } from '../_lib/actions';

// Metadata should typically stay in Page.js, but keeping it if you need it here
export const metadata = {
  title: 'Google-Login',
};

function SignInButton() {
  return (
    <form action={signInAction} className="w-full">
      <button className="flex items-center justify-center gap-4 md:gap-6 text-base md:text-lg border border-primary-300 px-4 md:px-10 py-4 font-medium w-full transition-all hover:bg-primary-50 active:scale-[0.98]">
        <img
          src="https://authjs.dev/img/providers/google.svg"
          alt="Google logo"
          height="24"
          width="24"
          className="shrink-0"
        />
        {/* 'whitespace-nowrap' prevents the text from breaking awkwardly; 
            'truncate' or 'text-sm' helps on tiny screens */}
        <span className="truncate">Student - Continue with Google</span>
      </button>
    </form>
  );
}

export default SignInButton;
