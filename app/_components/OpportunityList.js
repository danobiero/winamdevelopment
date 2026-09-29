import { getOpportunities } from '../_lib/data-service';
import OpportunityCard from './OpportunityCard';
import OpportunityScroller from './OpportunityScroller';

async function OpportunityList({ filter }) {
  const opportunities = await getOpportunities();

  if (!opportunities?.length)
    return (
      <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-base sm:text-lg font-bold text-slate-700">
          No opportunities available at the moment.
        </p>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Please check back soon for upcoming asset allocations.
        </p>
      </div>
    );

  const normalize = (str) =>
    (str || '').toLowerCase().replace(/[\s_-]+/g, '');

  const displayOpportunities = opportunities.filter((opportunity) => {
    // Exclude non-active opportunities (hidden, closed, inactive, etc.)
    if (opportunity.status?.toLowerCase() !== 'active') return false;

    const opTypeNorm = normalize(opportunity.type);

    // Exclude Fees
    if (opTypeNorm === 'fees' || opTypeNorm === 'fee') return false;

    // Show all
    if (!filter || filter === 'all') return true;

    const filterNorm = normalize(filter);

    // Real Estate
    if (filterNorm === 'realestate') {
      return opTypeNorm === 'realestate';
    }

    // Private Equity / Stocks
    if (
      filterNorm === 'stocks' ||
      filterNorm === 'privateequity' ||
      filterNorm === 'equity'
    ) {
      return (
        opTypeNorm === 'privateequity' ||
        opTypeNorm === 'equity' ||
        opTypeNorm === 'stocks' ||
        opTypeNorm === 'stock' ||
        opTypeNorm === 'debtfund'
      );
    }

    // Ventures
    if (
      filterNorm === 'ventures' ||
      filterNorm === 'venture' ||
      filterNorm === 'venturecapital'
    ) {
      return (
        opTypeNorm === 'venturecapital' ||
        opTypeNorm === 'businessventure' ||
        opTypeNorm === 'ventures' ||
        opTypeNorm === 'venture'
      );
    }

    // Fallback exact normalized match
    return opTypeNorm === filterNorm;
  });

  if (!displayOpportunities.length)
    return (
      <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-slate-100">
        <p className="text-base sm:text-lg font-bold text-slate-700">
          No opportunities found for this category.
        </p>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Try selecting another category or view all investments.
        </p>
      </div>
    );

  const count = displayOpportunities.length;

  let gridClasses =
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 xl:gap-5 w-full';
  let containerClasses = 'w-full';

  if (count === 1) {
    gridClasses = 'grid-cols-1 gap-4 max-w-sm sm:max-w-md mx-auto w-full';
    containerClasses = 'max-w-md mx-auto w-full';
  } else if (count === 2) {
    gridClasses =
      'grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6 max-w-2xl xl:max-w-3xl mx-auto w-full';
    containerClasses = 'max-w-3xl mx-auto w-full';
  } else if (count === 3) {
    gridClasses =
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6 max-w-5xl xl:max-w-6xl mx-auto w-full';
    containerClasses = 'max-w-6xl mx-auto w-full';
  } else if (count > 4) {
    gridClasses =
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 xl:gap-5 w-full';
    containerClasses = 'w-full';
  }

  return (
    <div className="w-full flex items-center justify-center">
      {/* 📱 Mobile View: 1 opportunity per slide with horizontal swipe & arrow controls */}
      <div className="w-full block sm:hidden">
        <OpportunityScroller opportunities={displayOpportunities} />
      </div>

      {/* 💻 Tablet & Desktop View: Multi-column responsive grid */}
      <div
        className={`hidden sm:flex items-center justify-center ${containerClasses}`}
      >
        <div className={`grid ${gridClasses}`}>
          {displayOpportunities.map((opportunity) => (
            <OpportunityCard opportunity={opportunity} key={opportunity.id} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OpportunityList;
