export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy forPRAXIDA - Practical Financial Foundation',
};

export default function PrivacyPolicy() {
  const lastUpdated = 'February 27, 2026';

  return (
    /* Fluid container matching your layout style */
    <div className="w-full px-4 md:px-12 lg:px-20 py-12 space-y-12 max-w-5xl mx-auto">
      {/* Header Section */}
      <header className="border-b border-slate-100 pb-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          Privacy <span className="text-blue-600">Policy</span>
        </h1>
        <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest text-xs">
          Last Updated: {lastUpdated}
        </p>
      </header>

      {/* Content Section */}
      <main className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">1. Introduction</h2>
          <p>
            Welcome to PRAXIDA (the "Project," "we," "us," or "our"). We are
            committed to protecting your personal information and your right to
            privacy. This Privacy Policy explains how we collect, use, and
            safeguard your information when you visit our website.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            2. Information We Collect
          </h2>
          <p>
            We collect personal information that you voluntarily provide to us
            when you:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Register for lessons or materials.</li>
            <li>Contact us via our support forms.</li>
            <li>Subscribe to our newsletters.</li>
          </ul>
          <p>
            This may include names, email addresses, phone numbers, and payment
            information (processed via secure third-party providers).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            3. How We Use Your Information
          </h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Facilitate lesson reservations and resource downloads.</li>
            <li>
              Send administrative information and updates regardingPRAXIDA.
            </li>
            <li>Respond to user inquiries and offer support.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            4. Data Security
          </h2>
          <p>
            We implement appropriate technical and organizational security
            measures designed to protect the security of any personal
            information we process. However, please also remember that we cannot
            guarantee that the internet itself is 100% secure.
          </p>
        </section>

        <section className="space-y-4 p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">5. Contact Us</h2>
          <p>
            If you have questions or comments about this policy, you may contact
            our team at:
          </p>
          <div className="mt-4 font-medium text-slate-900">
            <p>Email: info@praxidaonline.com</p>
            <p>Mailing: P.O. Box 98493, Lakewood, WA 98499, USA</p>
          </div>
        </section>
      </main>
    </div>
  );
}
