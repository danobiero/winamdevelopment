import AdminSignInButton from '../_components/AdminSignInButton';
import SignInButton from '../_components/SignInButton';

export const metadata = {
  title: 'Login',
};

export default function Page() {
  return (
    /* 1. Added px-6 to prevent text from touching screen edges.
      2. Increased mt for desktop (md:mt-24) to balance the white space.
      3. text-center is vital for mobile layouts.
    */
    <div className="flex flex-col gap-10 mt-16 md:mt-24 items-center px-6 text-center">
      {/* Responsive Font: text-2xl on mobile prevents awkward line breaks. 
        leading-tight keeps the lines close if the text wraps.
      */}
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
        Start your learning journey
      </h2>

      {/* Container for buttons:
        On mobile, buttons should be wider for better thumb reach.
        We cap the width at 400px so they don't look stretched on desktop.
      */}
      <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
        <SignInButton />
        <AdminSignInButton />
      </div>

      <p className="text-sm text-primary-600 opacity-70">
        Gmail is all you need to get the sessions
      </p>
    </div>
  );
}
