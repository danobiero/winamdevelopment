/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions',
  description:
    'Terms of Service for the Winam Development Group investment platform.',
};

export default function TermsAndConditions() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full px-4 md:px-12 lg:px-20 py-12 space-y-12 max-w-5xl mx-auto">
      {/* Header Section */}
      <header className="border-b border-slate-100 pb-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          Terms <span className="text-blue-600">& Conditions</span>
        </h1>

        <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest text-xs">
          Effective Date: January 01, {currentYear}
        </p>
      </header>

      {/* Main Legal Content */}
      <main className="text-slate-600 leading-relaxed space-y-10">
        {/* Acceptance */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              1
            </span>
            Acceptance of Terms
          </h2>

          <p>
            By accessing or using the Winam Development Group platform, you
            agree to comply with these Terms and Conditions. These terms govern
            your participation in our investment ecosystem and your use of the
            website, dashboards, and related digital services.
          </p>
        </section>

        {/* Investment Participation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              2
            </span>
            Investment Participation
          </h2>

          <p>
            Winam Development Group operates as a collaborative investment
            platform focused on real estate, equities, and long-term asset
            growth. Participation may involve capital contributions, ownership
            interests, or shareholder participation depending on the specific
            project.
          </p>

          <p>
            All investment opportunities are subject to individual shareholder
            agreements and project-specific terms.
          </p>
        </section>

        {/* Platform Use */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              3
            </span>
            Platform Usage
          </h2>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
            <p className="font-semibold text-slate-900">Users agree not to:</p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Use the platform for illegal or unauthorized activities.</li>

              <li>
                Attempt to access restricted systems, modify the platform, or
                compromise security.
              </li>

              <li>
                Misrepresent investment information or shareholder status.
              </li>

              <li>
                Distribute confidential investment data outside authorized
                channels.
              </li>
            </ul>
          </div>
        </section>

        {/* Investment Risk */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              4
            </span>
            Investment Risk Disclosure
          </h2>

          <p className="italic">
            Investments involve risk, including the potential loss of capital.
            Past performance of any asset class or project does not guarantee
            future results.
          </p>

          <p>
            Participants are responsible for evaluating the suitability of any
            investment opportunity based on their financial circumstances.
          </p>
        </section>

        {/* Security */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              5
            </span>
            Account Security
          </h2>

          <p>
            Users are responsible for maintaining the confidentiality of their
            login credentials and for all activities that occur under their
            accounts. The platform may use secure authentication technologies,
            including third-party identity providers.
          </p>
        </section>

        {/* Termination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              6
            </span>
            Termination of Access
          </h2>

          <p>
            Winam Development Group reserves the right to suspend or terminate
            access to the platform if these terms are violated or if activity is
            determined to compromise the integrity of the investment ecosystem.
          </p>
        </section>

        {/* Support */}
        <footer className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-slate-900">
            Questions about these terms?
          </h3>

          <p className="mt-2 text-slate-500">
            Contact our team for clarification regarding shareholder policies or
            platform usage.
          </p>

          <Link
            href="/support"
            className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Contact Us
          </Link>
        </footer>
      </main>
    </div>
  );
}
