import SelectCountry from "@/app/_components/SelectCountry";
import UpdateProfileForm from "@/app/_components/UpdateProfileForm";
import { auth } from "@/app/_lib/auth";
import { getStudent } from "@/app/_lib/data-service";

export const metadata = {
  title: 'Student Profile',
};

export default async function Page() {
  const session = await auth()
  const student = await getStudent(session.user.email)
  //console.log(student)
  
  return (
    <div>
      <h2 className="font-semibold text-2xl text-blue-950 mb-4">
        Update Profile
      </h2>

      <p className="text-lg mb-8 text-blue-950">
        The following information will make your class check-in
        process faster.
      </p>

      <UpdateProfileForm student={student}>
        <SelectCountry
          name="nationality"
          id="nationality"
          className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
          defaultCountry={student.SelectCountry}
        />
      </UpdateProfileForm>
    </div>
  );
}
