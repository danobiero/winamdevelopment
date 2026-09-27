import SelectCountry from '@/app/_components/SelectCountry';
import UpdateProfileForm from '@/app/_components/UpdateProfileForm';
import { auth } from '@/app/_lib/auth';
import { getUserProfile } from '@/app/_lib/data-service';

export const metadata = {
  title: 'Investor Profile',
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const user = await getUserProfile();

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
            Investor <span className="text-blue-600 dark:text-blue-400">Profile</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Keep your shareholder credentials up to date for portfolio compliance and account verification.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold shadow-2xs">
            Status: {user?.status ? user.status.toUpperCase() : 'VERIFIED'}
          </span>
        </div>
      </header>

      {/* Form Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        <UpdateProfileForm user={user}>
          <SelectCountry
            name="nationality"
            id="nationality"
            defaultCountry={user?.nationality || 'United States of America'}
          />
        </UpdateProfileForm>
      </div>
    </div>
  );
}
