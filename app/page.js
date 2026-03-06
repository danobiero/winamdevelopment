import Image from 'next/image';
import Link from 'next/link';
import gradient from '@/public/office_2.jpg';

export default function Page() {
  return (
    <div className="h-screen w-full">
      <main className="h-full w-full">
        {/* BACKGROUND LAYER: Occupies 100% of the screen from the very top */}
        <div className="absolute inset-0 z-0">
          <Image
            src={gradient}
            fill
            priority
            className="object-cover object-center"
            placeholder="blur"
            quality={100}
            alt="gradient background"
          />
        </div>

        {/* CONTENT LAYER: Perfectly centered over the background */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          {/* BRANDING: This matches your Google OAuth App Name */}
          <p className="text-white font-bold tracking-[0.2em] uppercase text-sm mb-2 opacity-80">
            Praxida
          </p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl text-white mb-4 tracking-tight font-normal">
            Welcome
          </h1>


          <Link
            href="/lessons"
            /* w-full on mobile for a better touch target, auto on desktop */
            className="bg-logo-10 text-blue-950 font-semibold hover:text-logo-100 transition-all text-lg md:text-xl px-10 py-5 rounded-lg w-full max-w-[280px] sm:w-auto shadow-lg"
          >
            Explore Lessons
          </Link>
        </div>

        {/* PRIVACY POLICY & TERMS: Essential for Google Verification */}
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center gap-4">
          <Link href="/privacy-policy" className="text-xs text-blue-950 hover:underline">
            Privacy Policy
          </Link>

          <span className="text-xs text-blue-950">|</span>

          <Link href="/terms-of-service" className="text-xs text-blue-950 hover:underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
