import Image from 'next/image';
import image1 from '@/public/logo.png';

export const metadata = {
  title: 'About PRAXIDA',
};

const services = [
  {
    title: 'Educate',
    description:
      'Personal Finance Guidance to help you budget smarter, save more, build wealth, and make confident money decisions.',
    iconColor: 'bg-orange-100 text-orange-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: 'Retirement',
    description:
      'Provide material checklist for retirement planning support that simplifies your options and helps you build a future that fits your goals.',
    iconColor: 'bg-green-100 text-green-700',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 12l2 2 4-4" />
        <path d="M8 7h8" />
        <path d="M8 17h8" />
      </svg>
    ),
  },
  {
    title: 'Tax Reviews',
    description:
      'IRS Notice Reviews to break down confusing tax letters, respond the right way, and avoid unnecessary penalties.',
    iconColor: 'bg-yellow-100 text-yellow-700',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    ),
  },
  {
    title: 'Calendar',
    description:
      'Join us for our Group sessions designed to promote practical, foundational finance knowledge—empowering you with confidence.',
    iconColor: 'bg-blue-100 text-blue-700',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01" />
        <path d="M12 14h.01" />
        <path d="M16 14h.01" />
        <path d="M8 18h.01" />
        <path d="M12 18h.01" />
        <path d="M16 18h.01" />
      </svg>
    ),
  },
];

export default function Page() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 lg:py-24 space-y-24 lg:space-y-40">
      {/* 1. HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-7 order-2 lg:order-1 space-y-8">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-bold tracking-wide uppercase rounded-full">
            Our Mission
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
            Clarity for your{' '}
            <span className="text-blue-600">Financial Future.</span>
          </h1>

          <div className="space-y-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
            <p>
              Our mission is to empower individuals with **clarity and
              confidence** by providing accessible, foundational personal
              finance coaching within the{' '}
              <span className="text-logo-100 font-bold underline decoration-blue-200">
                PRAXIDA
              </span>{' '}
              ecosystem.
            </p>

            <div className="relative py-8 group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent rounded-3xl -rotate-1 group-hover:rotate-0 transition-transform duration-500" />
              <div className="relative border-l-8 border-blue-600 pl-8 py-2">
                <p className="text-2xl md:text-3xl font-medium text-blue-950 italic leading-snug">
                  "Building strength through clear, practical financial
                  foundations."
                </p>
                <p className="text-xs uppercase tracking-[0.2em] mt-4 text-blue-600 font-black">
                  The PRAXIDA Motto
                </p>
              </div>
            </div>

            <p className="text-lg">
              We believe that when individuals understand the basics, they make
              smarter financial choices. We provide holistic, practical coaching
              focusing on foundations that last a lifetime.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 order-1 lg:order-2">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-200 to-indigo-100 rounded-[2rem] rotate-3 group-hover:rotate-6 transition-transform duration-500 -z-10 opacity-70" />
            <Image
              src={image1}
              alt="Financial coaching session"
              placeholder="blur"
              quality={100}
              className="rounded-[2rem] shadow-2xl object-cover aspect-[4/5] w-full transform transition-all duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section className="relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-slate-50/50 -z-10 rounded-[3rem]" />
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Our Services
          </h2>
          <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${service.iconColor}`}
              >
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. LEGAL & PRIVACY SECTION */}
      <section className="grid md:grid-cols-2 gap-12 border-t border-slate-100 pt-24">
        <LegalCard
          title="Terms & Conditions"
          icon={
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          }
        >
          <p>
            By participating, you agree to use our materials for{' '}
            <strong>personal educational purposes only</strong>. Content is not
            legal, tax, or investment advice.
          </p>
          <p>
            We reserve the right to update lesson content and modify delivery
            formats to maintain the highest quality of effectiveness.
          </p>
        </LegalCard>

        <LegalCard
          title="Privacy Statement"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          }
        >
          <p>
            Your data is used solely to improve your learning experience. We
            never sell or share personal details with third parties for
            marketing.
          </p>
          <p>
            We are committed to protecting your personal information at every
            step of your PRAXIDA journey.
          </p>
        </LegalCard>
      </section>
    </div>
  );
}

// Helper Component for Legal Cards
function LegalCard({ title, icon, children }) {
  return (
    <div className="group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all duration-500">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-6 h-6"
        >
          {icon}
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
        {title}
      </h2>
      <div className="space-y-4 text-slate-500 text-sm leading-[1.8]">
        {children}
      </div>
    </div>
  );
}
