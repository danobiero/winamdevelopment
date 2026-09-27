/* eslint-disable react/no-unescaped-entities */
export const metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for the Winam Development Group investment platform.',
};

export default function PrivacyPolicy() {
  const lastUpdated = 'February 27, 2026';

  return (
    <div className="w-full px-4 md:px-12 lg:px-20 py-12 space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <header className="border-b border-slate-100 pb-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          Privacy <span className="text-blue-600">Policy</span>
        </h1>

        <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest text-xs">
          Last Updated: {lastUpdated}
        </p>
      </header>

      {/* Main Content */}
      <main className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">
        {/* Introduction */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">1. Introduction</h2>

          <p>
            Winam Development Group (“WINAM”, “we”, “our”, or “us”) is committed
            to protecting your privacy and safeguarding your personal
            information. This Privacy Policy explains how we collect, use, and
            protect information when you access our website and investment
            platform.
          </p>

          <p>
            By using the WINAM platform, you consent to the data practices
            described in this policy.
          </p>
        </section>

        {/* Information Collection */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            2. Information We Collect
          </h2>

          <p>We may collect the following types of information:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Account information such as name and email address.</li>
            <li>
              Authentication information provided through secure login services.
            </li>
            <li>Investment participation and transaction records.</li>
            <li>Communication data submitted through contact forms.</li>
          </ul>

          <p>
            Payment information related to investments may be processed through
            secure third-party payment processors and is not stored directly by
            our platform.
          </p>
        </section>

        {/* Use of Information */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            3. How We Use Your Information
          </h2>

          <p>We use collected information to:</p>

          <ul className="list-disc pl-6 space-y-2">
            <li>Provide access to the investment platform.</li>
            <li>Manage shareholder participation and contributions.</li>
            <li>Communicate important platform updates.</li>
            <li>Respond to support or contact requests.</li>
            <li>Maintain platform security and system integrity.</li>
          </ul>
        </section>

        {/* Data Security */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            4. Data Security
          </h2>

          <p>
            We implement industry-standard technical and organizational
            safeguards designed to protect personal information from
            unauthorized access, disclosure, or misuse.
          </p>

          <p>
            However, no internet-based platform can guarantee complete security,
            and users should take appropriate precautions when accessing online
            services.
          </p>
        </section>

        {/* Third Party Services */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            5. Third-Party Services
          </h2>

          <p>
            Our platform may rely on secure third-party services for
            authentication, infrastructure, and payment processing. These
            services operate under their own privacy policies and security
            standards.
          </p>
        </section>

        {/* Contact */}
        <section className="space-y-4 p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">6. Contact Us</h2>

          <p>
            If you have questions regarding this Privacy Policy or the handling
            of your personal data, please contact us:
          </p>

          <div className="mt-4 font-medium text-slate-900">
            <p>Email: info@winamdevelopment.com</p>
            <p>Location: United States</p>
          </div>
        </section>
      </main>
    </div>
  );
}
