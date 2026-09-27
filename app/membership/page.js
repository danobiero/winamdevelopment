// app/membership/page.js
import BecomingAMember from './_components/BecomingAMember';
import MembershipRealtimeRefresh from './_components/MembershipRealtimeRefresh';
import { auth } from '@/app/_lib/auth';
import { getMemberStatusByEmail } from '@/app/_lib/data-service';
import { getApplicationFee } from '@/app/_lib/actions';
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

  const membershipRecord = await getMemberStatusByEmail(session.user.email);
  const fee = await getApplicationFee();

  return (
    <main className="py-12">
      <MembershipRealtimeRefresh userId={session.user.id}>
        <BecomingAMember
          session={session}
          membershipRecord={membershipRecord}
          fee={fee}
        />
      </MembershipRealtimeRefresh>
    </main>
  );
}
