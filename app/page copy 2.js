import Image from 'next/image';
import Link from 'next/link';
import gradient from '@/public/office_2.jpg';

export default function Page() {
  return (
    <div className="h-screen w-full overflow-hidden">
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
          {/* Responsive Text: scaled down for mobile to avoid overflow */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl text-blue-950 mb-10 tracking-tight font-normal">
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
      </main>
    </div>
  );
}
