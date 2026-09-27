import { useState, useEffect } from 'react';
import { ScaleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function AgreementStep({ onSign, isWorking }) {
  const [hasAgreed, setHasAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Get today's date on component mount
  useEffect(() => {
    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    );
  }, []);

  // The button is only enabled if they check the box, type a signature, and the system isn't currently working.
  const canSign = hasAgreed && signature.trim().length > 1 && !isWorking;

  const handleSignClick = () => {
    if (canSign) {
      // Passes the typed signature back to the parent component
      onSign(signature);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 md:mt-20 p-8 md:p-12 bg-white border border-slate-200 rounded-3xl text-center shadow-xl">
      <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <ScaleIcon className="h-10 w-10 text-primary-600" />
      </div>
      <h2 className="text-3xl font-black text-primary-950 mb-2">
        Membership Agreement
      </h2>
      <p className="text-slate-500 mb-8 max-w-xl mx-auto">
        Please review and sign the formal agreement below to activate your
        membership.
      </p>

      {/* Formal Document Scrollable Area (Inline HTML) */}
      <div className="bg-slate-50 border border-slate-300 rounded-2xl h-96 overflow-y-auto p-6 md:p-8 text-left mb-8 shadow-inner relative">
        <div className="absolute top-6 right-6 text-slate-300 hidden md:block">
          <DocumentTextIcon className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-6 font-serif">
          WINAM DEVELOPMENT GROUP - MEMBER AGREEMENT
        </h3>

        {/* Paste your 14 pages of inline HTML text here */}
        <div className="space-y-4 text-slate-700 text-sm md:text-base font-serif leading-relaxed pr-4">
          <p>
            <strong>THIS AGREEMENT</strong> is entered into as of the date of
            digital signature, by and between the Company and the Member signing
            below.
          </p>
          <p>
            <strong>1. Capital Contributions.</strong> The Member agrees to
            begin funding their Core Opportunity minimum $2,000 shareholding within 30 days of
            the execution of this Agreement.
          </p>
          <p>
            <strong>2. Membership Activation.</strong> Upon the execution of
            this Agreement and the initial capital contribution, the Member's
            rights and privileges shall be formally activated in accordance with
            the Company's bylaws.
          </p>
          <p>
            <strong>3. Liability.</strong> The Member shall not be personally
            liable for any debt, obligation, or liability of the Company,
            whether arising in contract, tort, or otherwise, solely by reason of
            being a Member.
          </p>
          {/* Add more legal HTML here as needed */}
          <p className="pt-8 font-bold">
            <em>[End of Document]</em>
          </p>
        </div>
      </div>

      {/* Signing Controls */}
      <div className="max-w-2xl mx-auto text-left mb-8 space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="flex items-center h-5 mt-0.5">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="w-5 h-5 border-slate-300 rounded text-primary-600 focus:ring-primary-600 cursor-pointer"
            />
          </div>
          <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
            I acknowledge that I have read the Operating Agreement in its
            entirety and agree to its terms and conditions.
          </span>
        </label>

        {/* Signature & Date Container */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label
              htmlFor="signature"
              className="block text-sm font-bold text-slate-700 mb-1"
            >
              Digital Signature
            </label>
            <input
              type="text"
              id="signature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your full legal name"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-serif italic text-lg"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <label
              htmlFor="date"
              className="block text-sm font-bold text-slate-700 mb-1"
            >
              Date
            </label>
            <input
              type="text"
              id="date"
              value={currentDate}
              readOnly
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-serif italic cursor-not-allowed select-none text-lg"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSignClick}
        disabled={!canSign}
        className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-md w-full md:w-auto min-w-[250px]"
      >
        {isWorking ? 'Processing Signature...' : 'Sign & Continue'}
      </button>

      <div className="mt-8 block px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest w-fit mx-auto">
        Step 5 of 7
      </div>
    </div>
  );
}
