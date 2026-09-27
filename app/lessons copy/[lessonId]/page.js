import { Suspense } from 'react';
import { auth } from '@/app/_lib/auth';
import { getOpportunityById } from '@/app/_lib/data-service';

import OpportunityCard from '@/app/_components/OpportunityCard';
import TextExpander from '@/app/_components/TextExpander';
import LoginMessage from '@/app/_components/LoginMessage';
import Spinner from '@/app/_components/Spinner';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const opportunity = await getOpportunityById(params.opportunityId);
  if (!opportunity || !opportunity.name)
    return { title: 'Opportunity Not Found' };
  return { title: `${opportunity.name}` };
}

export default async function Page({ params }) {
  const [opportunity, session] = await Promise.all([
    getOpportunityById(params.opportunityId),
    auth(),
  ]);

  if (!opportunity) {
    return (
      <div className="text-center mt-20 text-xl text-red-500">
        No opportunity available, try again later.
        <div className="mt-4">
          <a
            href="/opportunities"
            className="text-primary-600 underline hover:text-primary-800"
          >
            Go back to opportunities
          </a>
        </div>
      </div>
    );
  }

  const { name, description, status, minimum_investment } = opportunity;
  const isActive = status === 'active';

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4">
      {/* 🔹 HERO SECTION (Matches Lesson Hero Pattern) */}
      <OpportunityCard opportunity={opportunity} />

      {/* 🔹 ACTION SECTION (Matches Lesson Layout) */}
      <div className="text-center mt-8 sm:mt-12 md:mt-16">
        {/* Header & CTA - Only shown for Active opportunities */}
        {isActive && (
          <>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
              Invest in {name} Today
            </h2>

            {/* Centered Description (Optional refinement) */}
            {description && (
              <div className="max-w-3xl mx-auto mb-8 text-slate-600 text-lg leading-relaxed px-4">
                <TextExpander>{description}</TextExpander>
              </div>
            )}

            <div className="mb-8">
              <Suspense fallback={<Spinner />}>
                {/* Better UX: If you have a Reservation-style component 
                  for opportunities, it would go here. Otherwise, the 
                  primary button serves as the main CTA.
                */}
                <button className="bg-primary-600 hover:bg-primary-700 transition-all duration-300 text-white px-8 py-4 rounded-xl text-xl font-medium shadow-xl active:scale-95">
                  Invest Now (${minimum_investment?.toLocaleString()}+)
                </button>
              </Suspense>
            </div>
          </>
        )}

        {/* 🔹 AUTH & STATUS LOGIC (Matches Lesson Logic Flow) */}
        <div className="mt-4">
          {session?.user ? (
            isActive ? (
              <p className="text-primary-600 font-semibold italic">
                Welcome back, Investor. Ready to expand your portfolio?
              </p>
            ) : (
              <div className="text-gray-500 font-semibold text-lg bg-gray-100 inline-block px-6 py-2 rounded-full">
                Status: <span className="capitalize">{status}</span>
              </div>
            )
          ) : (
            // If not logged in and active, show login message (just like lesson)
            isActive && <LoginMessage />
          )}
        </div>
      </div>
    </div>
  );
}
