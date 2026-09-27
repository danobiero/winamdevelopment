/* eslint-disable react/no-unescaped-entities */
import Image from 'next/image';
import image1 from '@/public/logo.png';

export const metadata = {
  title: 'About WINAM Development Group',
};

const services = [
  {
    title: 'Real Estate',
    description:
      'Strategic investment in residential and commercial developments, focusing on high-growth urban and emerging markets.',
    iconColor: 'bg-orange-100 text-orange-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 sm:w-5 sm:h-5"
      >
        <path d="M3 21h18" />
        <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
        <path d="M5 21V10.85" />
        <path d="M19 21V10.85" />
        <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
      </svg>
    ),
  },
  {
    title: 'Stock Market',
    description:
      'Active management of a diverse equities portfolio, leveraging data-driven insights to maximize compounding returns for shareholders.',
    iconColor: 'bg-green-100 text-green-700',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 sm:w-5 sm:h-5"
      >
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
  {
    title: 'Asset Growth',
    description:
      'Continuous portfolio rebalancing and risk assessment to ensure long-term wealth preservation and sustained capital appreciation.',
    iconColor: 'bg-yellow-100 text-yellow-700',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 sm:w-5 sm:h-5"
      >
        <path d="M12 2v20" />
        <path d="m17 5-5-3-5 3" />
        <path d="m17 19-5 3-5-3" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: 'Shareholder Equity',
    description:
      'Transparency-first reporting and collaborative investment strategies that empower our shareholders as partners in every venture.',
    iconColor: 'bg-blue-100 text-blue-700',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 sm:w-5 sm:h-5"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Page() {
  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-4 xl:py-6 lg:h-full lg:max-h-full lg:overflow-hidden flex flex-col justify-center">
      {/* 3-COLUMN HORIZONTAL GRID ON LAPTOP & LARGE SCREENS, STACKED ON MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 lg:h-full lg:max-h-full items-stretch">
        
        {/* ========================================================= */}
        {/* 1. LEFT PANEL: PURPOSE, MOTTO & LOGO (lg:col-span-4) */}
        {/* ========================================================= */}
        <section className="lg:col-span-4 bg-white/80 backdrop-blur-xs p-5 xl:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
          <div className="space-y-3 xl:space-y-4">
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold tracking-wider uppercase rounded-full">
              Our Purpose
            </div>

            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-black text-slate-900 leading-tight tracking-tight">
              Building Wealth through{' '}
              <span className="text-blue-600">Collective Growth.</span>
            </h1>

            <p className="text-xs xl:text-sm text-slate-600 leading-relaxed">
              Winam Development Group is a premier investment collective focused
              on securing the future through{' '}
              <strong className="text-slate-900 font-semibold">
                strategic real estate and market equity
              </strong>
              . We empower our shareholders within the{' '}
              <span className="text-blue-950 font-bold underline decoration-blue-200">
                WINAM
              </span>{' '}
              ecosystem to build lasting legacies.
            </p>

            {/* Motto Box */}
            <div className="relative border-l-4 border-blue-600 bg-blue-50/70 pl-3.5 pr-3 py-2.5 rounded-r-2xl">
              <p className="text-xs xl:text-sm font-semibold text-blue-950 italic leading-snug">
                "Building strength through diversified, community-driven
                investment foundations."
              </p>
              <p className="text-[10px] xl:text-[11px] uppercase tracking-wider mt-1.5 text-blue-600 font-black">
                The WINAM Development Motto
              </p>
            </div>
          </div>

          {/* Logo Showcase */}
          <div className="bg-slate-50/90 rounded-2xl border border-slate-100 p-3 xl:p-4 flex items-center justify-center">
            <Image
              src={image1}
              alt="Winam Development Group Logo"
              placeholder="blur"
              quality={95}
              className="w-auto h-16 xl:h-20 2xl:h-24 object-contain"
              priority
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. MIDDLE PANEL: 4 INVESTMENT PILLARS (lg:col-span-5) */}
        {/* ========================================================= */}
        <section className="lg:col-span-5 bg-slate-50/80 p-5 xl:p-6 rounded-3xl border border-slate-200/80 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-lg xl:text-xl font-black text-slate-900 tracking-tight">
                Investment Pillars
              </h2>
              <p className="text-[11px] text-slate-500">Core strategic asset classes</p>
            </div>
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
          </div>

          {/* 2x2 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:gap-3.5 flex-1">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white p-3.5 xl:p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col justify-between hover:shadow-md hover:border-blue-100 transition-all duration-200"
              >
                <div>
                  <div
                    className={`w-8 h-8 xl:w-9 xl:h-9 rounded-xl flex items-center justify-center mb-2 xl:mb-2.5 ${service.iconColor}`}
                  >
                    {service.icon}
                  </div>
                  <h3 className="text-xs xl:text-sm font-bold text-slate-900 mb-1">
                    {service.title}
                  </h3>
                </div>
                <p className="text-[11px] xl:text-xs text-slate-500 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. RIGHT PANEL: GOVERNANCE & SECURITY (lg:col-span-3) */}
        {/* ========================================================= */}
        <section className="lg:col-span-3 bg-white/80 backdrop-blur-xs p-5 xl:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-lg xl:text-xl font-black text-slate-900 tracking-tight">
                Governance & Trust
              </h2>
              <p className="text-[11px] text-slate-500">Investor protection & security</p>
            </div>
            <div className="w-8 h-1 bg-blue-600 rounded-full" />
          </div>

          <div className="flex flex-col gap-3 xl:gap-3.5 flex-1 justify-between">
            {/* Shareholder Agreement Card */}
            <div className="bg-slate-50/70 p-3.5 xl:p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col justify-between flex-1 hover:shadow-md transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-blue-200">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-4 h-4"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  </svg>
                </div>
                <h3 className="text-xs xl:text-sm font-bold text-slate-900">
                  Shareholder Agreement
                </h3>
              </div>
              <p className="text-[11px] xl:text-xs text-slate-500 leading-relaxed">
                Governed by our Shareholder Operating Agreement. We provide
                detailed quarterly reports to give all partners complete visibility into
                asset performance and capital allocations.
              </p>
            </div>

            {/* Confidentiality Card */}
            <div className="bg-slate-50/70 p-3.5 xl:p-4 rounded-2xl border border-slate-200/60 shadow-2xs flex flex-col justify-between flex-1 hover:shadow-md transition-all">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-200">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xs xl:text-sm font-bold text-slate-900">
                  Confidentiality & Privacy
                </h3>
              </div>
              <p className="text-[11px] xl:text-xs text-slate-500 leading-relaxed">
                Shareholder data and proprietary investment strategies are
                strictly protected using enterprise-grade security across our
                digital equity platforms.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
