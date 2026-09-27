export const metadata = {
  title: 'Risk Disclosure',
  description:
    'Important investment risk disclosures for participants in the Winam Development Group platform.',
};

export default function RiskDisclosure() {
  const lastUpdated = 'February 27, 2026';

  return (
    <div className="w-full px-4 md:px-12 lg:px-20 py-12 space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <header className="border-b border-slate-100 pb-10">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          Risk <span className="text-blue-600">Disclosure</span>
        </h1>

        <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest text-xs">
          Last Updated: {lastUpdated}
        </p>
      </header>

      {/* Content */}
      <main className="prose prose-slate max-w-none text-slate-600 leading-relaxed space-y-8">
        {/* General Risk */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            1. General Investment Risk
          </h2>

          <p>
            All investments involve risk. Participation in projects or
            opportunities presented through Winam Development Group may result
            in partial or total loss of invested capital.
          </p>

          <p>
            No guarantee is made that any investment will achieve its intended
            financial objectives or generate profit.
          </p>
        </section>

        {/* Market Risk */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">2. Market Risk</h2>

          <p>
            Investment performance may be affected by market conditions,
            including fluctuations in real estate values, equity markets,
            economic cycles, interest rates, and geopolitical events.
          </p>

          <p>
            Market conditions may change rapidly and unpredictably, impacting
            asset values and potential returns.
          </p>
        </section>

        {/* Liquidity Risk */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            3. Liquidity Risk
          </h2>

          <p>
            Certain investments offered through the platform may be illiquid,
            meaning investors may not be able to quickly sell or withdraw their
            investment.
          </p>

          <p>
            Participants should be prepared to hold investments for extended
            periods depending on project timelines.
          </p>
        </section>

        {/* No Financial Advice */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            4. No Financial Advice
          </h2>

          <p>
            Information provided through the Winam Development Group platform is
            intended for informational purposes only and does not constitute
            financial, legal, or investment advice.
          </p>

          <p>
            Participants should consult qualified financial professionals before
            making investment decisions.
          </p>
        </section>

        {/* Investor Responsibility */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            5. Investor Responsibility
          </h2>

          <p>
            Investors are responsible for evaluating the risks associated with
            each opportunity and determining whether the investment is suitable
            based on their financial situation and risk tolerance.
          </p>
        </section>

        {/* Final Disclaimer */}
        <section className="space-y-4 p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">
            Important Notice
          </h2>

          <p>
            Past performance of any investment or asset class does not guarantee
            future results. Participation in investment opportunities should be
            undertaken only after careful consideration of all associated risks.
          </p>
        </section>
      </main>
    </div>
  );
}
