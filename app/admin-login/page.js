import Image from 'next/image';
import AdminSignInButton from '../_components/AdminSignInButton';

export const metadata = {
  title: 'Admin Login | Winam Development Group',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Card */}
      <div className="w-full max-w-md rounded-[32px] border border-white/40 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-300/30 p-8 md:p-12 flex flex-col items-center text-center transition-all duration-300 hover:shadow-3xl">
        {/* Logo */}
        <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 bg-white shadow-sm overflow-hidden">
          <Image
            src="/logo.png"
            fill
            alt="Winam Logo"
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

        {/* Button */}
        <div className="w-full">
          <div className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]">
            <AdminSignInButton />
          </div>
        </div>

        {/* Divider glow */}
        <div className="w-full my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
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
