import SignInButton from '../_components/SignInButton';
import Image from 'next/image';

export const metadata = {
  title: 'Shareholder Login | Winam Development Group',
};

export default function Page() {
  return (
    /* py-8 on mobile, py-12 on desktop to save vertical space */
    <div className="flex-1 flex items-center justify-center py-8 md:py-12 px-4 md:px-8">
      {/* max-w-[95%] ensures it doesn't touch screen edges on tiny devices */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-12 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
        {/* Branding Section */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-sm border border-slate-100 overflow-hidden">
          <Image
            src="/logo.png"
            fill
            alt="Winam Development Group Logo"
            className="object-contain p-2"
            priority
          />
        </div>

        <header className="space-y-3 mb-8 md:mb-10">
          {/* text-2xl on mobile, text-3xl on desktop */}
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Winam Development Group
            <br />
            <span className="text-blue-600">Portal Access</span>
          </h2>
          <p className="text-slate-500 text-xs md:text-base">
            Securely create or manage your account.
          </p>
        </header>

        {/* Buttons Section: Added overflow-hidden to prevent button bleed */}
        <div className="flex flex-col gap-4 w-full overflow-hidden">
          <div className="w-full transform transition-transform hover:scale-[1.01] active:scale-95">
            <SignInButton />
          </div>
        </div>

        {/* Footer Hint: Adjusted tracking and size for mobile readability */}
        <footer className="mt-8 md:mt-10 w-full">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider bg-slate-50 px-4 py-2.5 rounded-full border border-slate-100 inline-block max-w-full truncate">
            Secure sign-in with your Gmail
          </p>
        </footer>
      </div>
    </div>
  );
}
