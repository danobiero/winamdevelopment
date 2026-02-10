'use client';

import { useState } from 'react';
import { updateProfile } from '../_lib/actions';
import SubmitButton from './SubmitButton';

function UpdateProfileForm({ student, children }) {
  const [count, setCount] = useState();
  const { fullName, email, nationality, telephone } = student;

  return (
    <div>
      <form
        action={updateProfile}
        className="bg-primary-100 py-8 px-12 text-lg flex gap-6 flex-col"
      >
        {/* Full Name */}
        <div className="space-y-2">
          <label>Full Name</label>
          <input
            name="fullName"
            defaultValue={fullName}
            maxLength={50}
            required
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label>Email</label>
          <input
            name="email"
            disabled
            defaultValue={email}
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
          />
        </div>

        {/* Extra Children */}
        <div className="space-y-2">{children}</div>

        {/* Telephone */}
        <div className="space-y-2">
          <label htmlFor="telephone">Telephone Number</label>
          <input
            name="telephone"
            defaultValue={telephone}
            pattern="^[0-9]{9,12}$"
            title="Telephone number must be 9 to 12 digits"
            required
            className="px-5 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end items-center gap-6">
          <SubmitButton pendingLabel={'Updating...'}>Update Profile</SubmitButton>
        </div>
      </form>
    </div>
  );
}

/* function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="bg-logo-10 px-8 py-4 text-primary-800 font-semibold hover:bg-logo-100 transition-all disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-300"
    >
      {pending ? 'Updating...' : 'Update Profile'}
    </button>
  );
} */

export default UpdateProfileForm;
