import { auth } from '@/app/_lib/auth';
import { getAdmin } from './profile_actions';
import UpdateProfileForm from "./UpdateProfileAdminForm";

export const metadata = {
  title: 'Admin Profile',
};

export default async function Page() {
  const session = await auth();
  const admin = await getAdmin(session.user.email);
  console.log(session.user.email)

  return (
    <div>
      <h2 className="font-semibold text-2xl text-blue-950 mb-4">
        Update Profile
      </h2>

      <p className="text-lg mb-8 text-blue-950">
        The following information will update admin profile.
      </p>

      <UpdateProfileForm admin={admin}>
        
      </UpdateProfileForm>
    </div>
  );
}
