export const metadata = {
  title: 'Terms and Conditions',
  description: 'Terms of Service for PRAXIDA - Practical Financial Foundation',
};

export default function TermsAndConditions() {
  const currentYear = new Date().getFullYear();

  return (
    /* Standard fluid container for PRAXIDA pages */
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
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              1
            </span>
            Acceptance of Terms
          </h2>
          <p>
            By accessing or using the PRAXIDA website and our educational
            materials, you agree to be bound by these Terms and Conditions. If
            you disagree with any part of these terms, you may not access our
            services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              2
            </span>
            Intellectual Property
          </h2>
          <p>
            The content, organization, graphics, design, and other matters
            related to PRAXIDA are protected under applicable copyrights and
            trademarks. The copying, redistribution, or publication by you of
            any such matters or any part of the site is strictly prohibited
            without our express written permission.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              3
            </span>
            User Responsibilities
          </h2>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
            <p className="font-semibold text-slate-900">
              When using our platform, you agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the site for any illegal or unauthorized purpose.</li>
              <li>
                Attempt to hack, decompile, or reverse engineer any part of
                PRAXIDA.
              </li>
              <li>
                Share lesson materials with non-registered users without
                authorization.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              4
            </span>
            Disclaimer of Liability
          </h2>
          <p className="italic">
            PRAXIDA provides financial educational foundations for
            informational purposes only. We are not financial advisors. Any
            financial decisions made based on information from this site are the
            sole responsibility of the user.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">
              5
            </span>
            Termination
          </h2>
          <p>
            We reserve the right to terminate or suspend access to our services
            immediately, without prior notice or liability, for any reason
            whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        {/* Support Callout */}
        <footer className="mt-16 pt-10 border-t border-slate-100 flex flex-col items-center text-center">
          <h3 className="text-xl font-bold text-slate-900">
            Have questions about these terms?
          </h3>
          <p className="mt-2 text-slate-500">
            Reach out to our support team for clarification.
          </p>
          <a
            href="/support"
            className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Contact Support
          </a>
        </footer>
      </main>
    </div>
  );
}
