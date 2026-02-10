import Logo from '@/app/_components/Logo';
import Navigation from './Navigation';
import { auth } from '../_lib/auth';
import MobileMenu from './MobileMenu';

export default async function Header() {
  const session = await auth();

  return (
    <header className="bg-white border-b border-primary-300 px-6 py-4">
      <div className="flex justify-between items-center">
        <Logo />

        {/* SHOW FULL NAV ONLY WHEN SCREEN >1600px */}
        <div className="hidden xlShrink:hidden xl:block">
          <Navigation session={session} />
        </div>

        {/* SHOW MOBILE MENU FOR ANY SCREEN <1600px */}
        <div className="xlShrink:block xl:hidden">
          <MobileMenu session={session} />
        </div>
      </div>
    </header>
  );
}
