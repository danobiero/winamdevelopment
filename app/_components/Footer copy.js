import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#1a2332] text-slate-400 py-12 border-t border-slate-800">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        {/* TOP SECTION: Flexbox is often safer than Grid for varying widths */}
        <div className="flex flex-col md:flex-row flex-wrap justify-between gap-12 pb-12 border-b border-slate-800/60">
          {/* Brand Column - Always takes full width on small, 40% on medium+ */}
          <div className="basis-full md:basis-1/3 lg:basis-2/5 space-y-4">
            <Link
              href="/"
              className="text-2xl font-black tracking-tighter text-[#4ade80]"
            >
              PRAXIDA
            </Link>
            <p className="text-sm leading-relaxed max-w-sm">
              Building strength through clear, practical financial foundations.
              We empower you to budget better, save more, and plan for your
              future with absolute confidence.
            </p>
            <div className="h-1 w-12 bg-blue-600 rounded-full" />
          </div>

          {/* Links and Contact Wrapper - This group stays together */}
          <div className="flex flex-1 flex-wrap justify-between gap-10">
            {/* Quick Links */}
            <div className="space-y-4 min-w-[140px]">
              <h4 className="text-white font-bold uppercase tracking-widest text-[11px]">
                Explore
              </h4>
              <nav className="flex flex-col gap-2 text-sm">
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
                <Link
                  href="/support"
                  className="hover:text-white transition-colors"
                >
                  Help Center
                </Link>
              </nav>
            </div>

            {/* Contact Column */}
            <div className="space-y-4 md:text-right min-w-[200px]">
              <h4 className="text-white font-bold uppercase tracking-widest text-[11px]">
                Get in Touch
              </h4>
              <div className="space-y-4 text-sm">
                <p className="text-slate-300">
                  P.O. Box 98493, Lakewood, WA 98499
                </p>
                <div className="flex flex-col gap-1">
                  <a
                    href="tel:+18325342090"
                    className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    (832) 534-2090
                  </a>
                  <a
                    href="mailto:info@praxidaonline.com"
                    className="hover:text-blue-400 transition-colors text-xs"
                  >
                    info@praxidaonline.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium order-2 sm:order-1">
            © {currentYear} PRAXIDA. All rights reserved.
          </p>

          <nav className="flex gap-6 text-[10px] uppercase tracking-[0.2em] font-bold order-1 sm:order-2">
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
