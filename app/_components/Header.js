import Logo from '@/app/_components/Logo';
import Navigation from './Navigation';
import { auth } from '../_lib/auth';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const session = await auth();

  return (
    <header className="bg-white border-b border-slate-200/80 px-3.5 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5 relative z-50">
      <div className="w-full flex justify-between items-center">
        <Logo />

        {/* Desktop Nav: Shown only on xl screens */}
        <div className="hidden xl:block">
          <Navigation session={session} />
        </div>

        {/* Mobile Menu: Shown on anything smaller than xl */}
        <div className="xl:hidden">
          <MobileMenu session={session} />
        </div>
      </div>
    </header>
  );
}
