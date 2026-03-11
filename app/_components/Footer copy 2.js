import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    /* Reduced py-12 to py-4 to save vertical space */
    <footer className="w-full bg-[#1a2332] text-slate-400 py-4 border-t border-slate-800 flex-none">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        {/* Tightened gap-12 to gap-6 and pb-12 to pb-4 */}
        <div className="flex flex-col md:flex-row flex-wrap justify-between gap-6 pb-4 border-b border-slate-800/60">
          <div className="basis-full md:basis-1/3 lg:basis-2/5 space-y-2">
            <Link
              href="/"
              className="text-xl font-black tracking-tighter text-[#4ade80]"
            >
              PRAXIDA
            </Link>
            <p className="text-[11px] leading-tight max-w-sm">
              Building strength through clear, practical financial foundations.
            </p>
            <div className="h-1 w-8 bg-blue-600 rounded-full" />
          </div>

          {/* Links and Contact Wrapper */}
          <div className="flex flex-1 flex-wrap justify-between gap-6">
            <div className="space-y-2 min-w-[120px]">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                Explore
              </h4>
              <nav className="flex flex-col gap-1 text-[11px]">
                <Link
                  href="/lessons"
                  className="hover:text-white transition-colors"
                >
                  Course Lessons
                </Link>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  Our Vision
                </Link>
              </nav>
            </div>

            <div className="space-y-2 md:text-right min-w-[180px]">
              <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                Get in Touch
              </h4>
              <div className="space-y-1 text-[11px]">
                <p className="text-slate-300">
                  P.O. Box 98493, Lakewood, WA 98499
                </p>
                <div className="flex flex-col gap-0">
                  <a
                    href="tel:+18325342090"
                    className="text-lg font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    (832) 534-2090
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION - Reduced pt-8 to pt-4 */}
        <div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-medium order-2 sm:order-1">
            © {currentYear} PRAXIDA.
          </p>

          <nav className="flex gap-4 text-[9px] uppercase tracking-[0.2em] font-bold order-1 sm:order-2">
            <Link
              href="/terms-of-service"
              className="hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy-policy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
