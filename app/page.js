import gradient from '@/public/main_page_image_5.jpg';
import Image from 'next/image';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0">
        <Image
          src={gradient}
          fill
          priority
          placeholder="blur"
          quality={100}
          sizes="100vw"
          alt="Winam Development"
          className="object-cover object-center "
        />

        {/* Cinematic light falloff */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/70" />

        {/* Edge vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,black_90%)] opacity-50" />
      </div>

      {/* HERO CONTENT */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] px-6 text-center">
        {/* Top label */}
        <p className="text-white/80 tracking-[0.5em] uppercase text-xs md:text-sm mb-6 font-semibold">
          Winam Development Group
        </p>

        {/* Headline */}
        <h1
          className="text-white font-black tracking-tight leading-[0.9]
        text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl"
        >
          Invest in the <br className="hidden md:block" />
          <span className="text-blue-400">Future</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-xl text-white/90 text-base md:text-xl leading-relaxed">
          Strategic businesses driven by collective shareholders vision.
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/opportunities"
            className="inline-block bg-logo-300 text-blue-950 font-bold
            hover:bg-blue-600 hover:text-white transition-all duration-300
            px-10 py-4 rounded-full text-lg tracking-widest uppercase
            shadow-[0_15px_50px_rgba(0,0,0,0.4)]"
          >
            View Opportunities
          </Link>
        </div>
      </main>

      {/* Footer Links */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-xs text-white/70 uppercase tracking-widest flex items-center gap-3">
        <Link
          href="/privacy-policy"
          className="hover:text-white transition-colors"
        >
          Privacy
        </Link>

        <span className="opacity-50">|</span>

        <Link
          href="/terms-of-service"
          className="hover:text-white transition-colors"
        >
          Terms
        </Link>

        <span className="opacity-50">|</span>

        <Link href="/login" className="hover:text-white transition-colors">
          Shareholders
        </Link>

        <span className="opacity-50">|</span>

        <Link
          href="/risk-disclosure"
          className="hover:text-white transition-colors"
        >
          Disclosures
        </Link>
      </div>
    </div>
  );
}
