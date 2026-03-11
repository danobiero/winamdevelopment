import SelectCountry from '@/app/_components/SelectCountry';
import UpdateProfileForm from '@/app/_components/UpdateProfileForm';
import { auth } from '@/app/_lib/auth';
import { getStudent } from '@/app/_lib/data-service';

export const metadata = {
  title: 'Student Profile',
};

export default async function Page() {
  const session = await auth();
  const student = await getStudent(session.user.email);

  return (
    <div className="w-full">
      <header className="mb-8 md:mb-12">
        {/* UPDATED HEADER BRANDING */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Update <span className="text-blue-600">Profile</span>
        </h1>

        <p className="text-sm md:text-base text-slate-500 font-medium mt-1">
          Update your profile to get full session access
        </p>
      </header>

      {/* Form Container */}
      <div className="max-w-2xl">
        <UpdateProfileForm student={student}>
          <SelectCountry
            name="nationality"
            id="nationality"
            /* Updated Select styles to match the new slate aesthetic */
            className="px-5 py-3 bg-slate-100 border border-slate-200 text-slate-700 w-full shadow-sm rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            defaultCountry={student.nationality}
          />
        </UpdateProfileForm>
      </div>
    </div>
  );
}
