import { auth } from '@/app/_lib/auth';
import { getAdmin } from '@/app/_lib/data-service';
import { redirect } from 'next/navigation';

import ProfileGate from './ProfileGate';

export const metadata = {
  title: 'Admin Profile',
};

export default async function Page() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/admin-login');
  }

  const admin = await getAdmin(session.user.email);

  if (!admin) {
    redirect('/admin-login');
  }

  return (
    <div>
      <h2 className="font-semibold text-2xl text-blue-950 mb-4">
        Update Profile
      </h2>

      <p className="text-lg mb-8 text-blue-950">
        The following information will update admin profile.
      </p>

      <ProfileGate admin={admin} />
    </div>
  );
}
