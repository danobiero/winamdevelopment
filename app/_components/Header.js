import Logo from '@/app/_components/Logo';
import Navigation from './Navigation';
import { auth } from '../_lib/auth';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const session = await auth();

  return (
    /* REMOVED: mb-2 md:mb-3 
       This eliminates the gap between the header border and the body content.
    */
    <header className="bg-white border-b border-primary-300 px-6 py-2 relative z-50">
      <div className="max-w-[100vw] flex justify-between items-center mx-auto">
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
