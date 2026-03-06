import React from 'react';

const services = [
  {
    title: 'Educate',
    description:
      'Personal Finance Guidance to help you budget smarter, save more, build wealth, and make confident money decisions.',
    iconColor: 'text-orange-500',
    // Briefcase Icon
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
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
    iconColor: 'text-green-600',
    // Checklist Icon
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
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
    iconColor: 'text-yellow-500',
    // Sun/Tax Review Icon
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
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
      'Join us for our Group sessions designed to promote practical, foundational finance knowledge—empowering you to make smarter money decisions with confidence.',
    iconColor: 'text-blue-600',
    // Calendar Icon
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
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

export default function ServicesSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      {/* Heading */}
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-slate-800 mb-4">Our Services</h2>
        <div className="w-16 h-1 bg-blue-400 mx-auto rounded-full"></div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
        {services.map((service, index) => (
          <div key={index} className="flex items-start space-x-6">
            <div className={`mt-1 flex-shrink-0 ${service.iconColor}`}>
              {service.icon}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-800">
                {service.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
