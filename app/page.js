import Image from 'next/image';
import Link from 'next/link';
import alt_logo_2 from '@/public/office_1.jpg'; // Desktop Image
import gradient from '@/public/office_2.jpg'; // Mobile Image

export default function Page() {
  return (
    /* 'fixed inset-0' removes the top gap by starting at 0,0.
       'h-[100dvh]' handles mobile address bars better than h-screen.
    */
    <div className="fixed inset-0 h-[100dvh] w-full overflow-hidden">
      <main className="relative h-full w-full">
        {/* MOBILE BACKGROUND: Visible only on small screens */}
        <div className="absolute inset-0 sm:hidden">
          <Image
            src={gradient}
            fill
            priority
            className="object-cover object-center"
            placeholder="blur"
            alt="mobile background"
          />
        </div>

        {/* DESKTOP BACKGROUND: Visible only on sm screens and up */}
        <div className="absolute inset-0 hidden sm:block">
          <Image
            src={gradient}
            fill
            priority
            className="object-cover object-center"
            placeholder="blur"
            quality={90}
            alt="desktop background"
          />
        </div>

        {/* CONTENT LAYER */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <p className="text-white font-bold tracking-[0.2em] uppercase text-sm mb-2 opacity-80">
            Praxida
          </p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl text-white mb-4 tracking-tight font-normal">
            Welcome
          </h1>

          <Link
            href="/lessons"
            className="bg-logo-10 text-blue-950 font-semibold hover:text-logo-100 transition-all text-lg md:text-xl px-10 py-5 rounded-lg w-full max-w-[280px] sm:w-auto shadow-lg"
          >
            Explore Lessons
          </Link>
        </div>

        {/* PRIVACY & TERMS: Pinned to bottom of the fixed viewport */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-4">
          <Link
            href="/privacy-policy"
            className="text-xs text-white/90 hover:underline drop-shadow-md"
          >
            Privacy Policy
          </Link>
          <span className="text-xs text-white/90">|</span>
          <Link
            href="/terms-of-service"
            className="text-xs text-white/90 hover:underline drop-shadow-md"
          >
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
