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
    /* Change 1: Added a container with responsive vertical spacing */
    <div className="md:pt-4">
      {/* Change 2: Responsive heading size (text-xl on mobile, 2xl on desktop) */}
      <h2 className="font-semibold text-xl md:text-2xl text-blue-950 mb-4 text-center md:text-left">
        Update Profile
      </h2>

      {/* Change 3: Slightly smaller text on mobile to save vertical space */}
      <p className="text-base md:text-lg mb-8 text-blue-950 text-center md:text-left opacity-90">
        The following information will make your session access faster.
      </p>

      {/* Change 4: Wrapped the form to ensure it centers well on larger mobile screens */}
      <div className="max-w-2xl mx-auto md:mx-0">
        <UpdateProfileForm student={student}>
          <SelectCountry
            name="nationality"
            id="nationality"
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-lg"
            defaultCountry={student.nationality}
          />
        </UpdateProfileForm>
      </div>
    </div>
  );
}
