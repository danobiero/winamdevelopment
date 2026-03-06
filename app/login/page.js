import AdminSignInButton from '../_components/AdminSignInButton';
import SignInButton from '../_components/SignInButton';
import Image from 'next/image';

export const metadata = {
  title: 'Login',
};

export default function Page() {
  return (
    /* Center everything vertically and horizontally */
    <div className="flex-1 flex items-center justify-center py-12 px-4 md:px-8">
      {/* The Login Card: Follows the CabinCard 'rounded-2xl' and 'shadow' style */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
        {/* Branding/Icon Placeholder */}
        {/* Branding/Icon Section */}
        <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100 overflow-hidden">
          <Image
            src="/logo.png"
            fill
            alt="FLOW-NET Logo"
            className="object-contain p-2" // 'object-contain' ensures the logo isn't cropped
            priority
          />
        </div>

        <header className="space-y-3 mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Start Your <br />
            <span className="text-blue-600">Financial Journey</span>
          </h2>
          <p className="text-slate-500 text-sm md:text-base">
            Access sessions and materials instantly.
          </p>
        </header>

        {/* Buttons Section: Full width within the card */}
        <div className="flex flex-col gap-4 w-full">
          <div className="w-full transform transition-transform hover:scale-[1.02]">
            <SignInButton />
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-100"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-400 uppercase tracking-widest font-bold">
              Admin Only
            </span>
            <div className="flex-grow border-t border-slate-100"></div>
          </div>

          <div className="w-full opacity-80 hover:opacity-100 transition-opacity">
            <AdminSignInButton />
          </div>
        </div>

        {/* Footer Hint */}
        <footer className="mt-10">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            Gmail is all you need
          </p>
        </footer>
      </div>
    </div>
  );
}
