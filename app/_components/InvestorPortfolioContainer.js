import { auth } from '../_lib/auth';
import { redirect } from 'next/navigation';
import { getInvestments } from '../_lib/data-service';
import InvestorPortfolioScroller from './InvestorPortfolioScroller';
import EmptyPortfolioState from './EmptyPortfolioState';
import { requestRedemption, getInvestmentValuations } from '../_lib/actions';

export default async function InvestorPortfolioContainer() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // Logic is now encapsulated in the data fetch
  const activeInvestments = await getInvestments(
    session.user.shareholderId
  );

  if (!activeInvestments.length) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[120px]">
        <EmptyPortfolioState />
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 md:px-0">
      
      <InvestorPortfolioScroller
        investments={activeInvestments}
        requestRedemptionAction={requestRedemption}
        getInvestmentValuationsAction={getInvestmentValuations}
      />
    </div>
  );
}