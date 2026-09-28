import Link from 'next/link';
import Image from 'next/image';
import logo from '@/public/logo.png';

function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2 sm:gap-3.5 z-10 min-w-0"
    >
      {/* Logo Container */}
      <div className="relative w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 transition-transform duration-300 group-hover:scale-105">
        <Image
          src={logo}
          fill
          alt="Winam logo"
          className="object-contain"
          sizes="(max-width: 640px) 36px, (max-width: 768px) 48px, 56px"
          quality={100}
          priority
        />
      </div>

      {/* Brand Text Section */}
      <div className="flex flex-col min-w-0 justify-center">
        {/* Mobile (<sm): Compact stacked layout to prevent overflow & awkward line wraps */}
        <div className="sm:hidden flex flex-col">
          <span className="text-sm font-black tracking-tight text-[#000033] leading-none">
            WINAM
          </span>
          <span className="text-xs sm:text-xs font-bold uppercase tracking-wider text-slate-500 leading-tight mt-0.5">
            DEVELOPMENT GROUP
          </span>
        </div>

        {/* Tablet & Desktop (sm+): Full brand title */}
        <div className="hidden sm:flex flex-col">
          <span className="text-lg md:text-2xl font-black tracking-tight text-[#000033] leading-none">
            WINAM DEVELOPMENT GROUP
          </span>
          <span className="hidden md:inline-block text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">
            Stronger Together
          </span>
        </div>
      </div>
    </Link>
  );
}

export default Logo;
