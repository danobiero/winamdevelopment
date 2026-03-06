import Link from 'next/link';
import Image from 'next/image';
import logo from '@/public/logo.png';

function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 sm:gap-4 z-10 shrink-0"
    >
      {/* Logo Container */}
      <div className="relative w-10 h-10 sm:w-14 sm:h-14 transition-transform duration-300 group-hover:scale-105">
        <Image
          src={logo}
          fill
          alt="FLOW-NET logo"
          className="object-contain"
          sizes="(max-width: 640px) 40px, 56px"
          priority
        />
      </div>

      {/* Brand Text Section */}
      <div className="flex flex-col">
        {/* Using the deep navy color from the Praxida logo */}
        <span className="text-xl sm:text-2xl font-black tracking-tighter text-[#000033] leading-none">
          <span className="text-[#000033]">PRAXIDA</span>
        </span>

        {/* Tagline matching the 'Clarity' text style from the logo image */}
        <span className="hidden md:inline-block text-[10px] sm:text-xs uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">
          Practical Financial Foundation
        </span>
      </div>
    </Link>
  );
}

export default Logo;
