// app/membership/page.js
import BecomingAMember from './_components/BecomingAMember';
import MembershipRealtimeRefresh from './_components/MembershipRealtimeRefresh';
import { auth } from '@/app/_lib/auth';
import { getMemberStatusByEmail } from '@/app/_lib/data-service';
import { getApplicationFee, getPaymentMode, getPendingFeePayment } from '@/app/_lib/actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Becoming a Member | Winam LLC',
};

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const [membershipRecord, fee, paymentMode, pendingFeePayment] = await Promise.all([
    getMemberStatusByEmail(session.user.email),
    getApplicationFee(),
    getPaymentMode(),
    getPendingFeePayment(session.user.email, session.user.shareholderId),
  ]);

  return (
    <main className="py-12">
      <MembershipRealtimeRefresh userId={session.user.id}>
        <BecomingAMember
          session={session}
          membershipRecord={membershipRecord}
          fee={fee}
          paymentMode={paymentMode}
          pendingFeePayment={pendingFeePayment}
        />
      </MembershipRealtimeRefresh>
    </main>
  );
}
