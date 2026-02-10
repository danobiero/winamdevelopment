'use client';

import { updateProfile } from '../_lib/actions';
import SubmitButton from './SubmitButton';

function UpdateProfileForm({ student, children }) {
  const { fullName, email, telephone } = student;

  return (
    <div className="w-full">
      <form
        action={updateProfile}
        /* Change 1: Responsive padding. px-4 on mobile, px-12 on desktop.
           Change 2: Reduced gap-6 to gap-4 on mobile for a tighter look.
        */
        className="bg-primary-100 py-6 md:py-8 px-5 md:px-12 text-base md:text-lg flex flex-col gap-4 md:gap-6 rounded-lg"
      >
        {/* Full Name */}
        <div className="space-y-2">
          <label className="font-medium text-blue-950">Full Name</label>
          <input
            name="fullName"
            defaultValue={fullName}
            maxLength={50}
            required
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-lg disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="font-medium text-blue-950">Email</label>
          <input
            name="email"
            disabled
            defaultValue={email}
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-lg disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-500"
          />
        </div>

        {/* Extra Children (Country Select) */}
        <div className="space-y-2">{children}</div>

        {/* Telephone */}
        <div className="space-y-2">
          <label htmlFor="telephone" className="font-medium text-blue-950">
            Telephone Number
          </label>
          <input
            name="telephone"
            defaultValue={telephone}
            pattern="^[0-9]{9,12}$"
            title="Telephone number must be 9 to 12 digits"
            required
            placeholder="e.g. 123456789 NO DASHES OR SPACES"
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-lg"
          />
        </div>

        {/* Submit */}
        {/* Change 3: Center button on mobile, align right on desktop */}
        <div className="flex justify-center md:justify-end items-center gap-6 mt-4">
          <SubmitButton pendingLabel={'Updating...'}>
            Update Profile
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

export default UpdateProfileForm;
