'use client';

import { useState } from 'react';
import { updateProfileAdmin } from './profile_actions';
import SubmitButton from '../../_components/SubmitButton';

export default function UpdateProfileForm({ admin }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(null);

  if (!admin) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormData(new FormData(e.currentTarget));
    setShowConfirm(true);
  };

  const confirmSubmit = async () => {
    await updateProfileAdmin(formData);
    window.location.href = '/admin-login';
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        /* UPDATED: px-4 on mobile, px-12 on desktop. Reduced text size for mobile. */
        className="bg-primary-100 py-6 px-4 md:py-8 md:px-12 text-base md:text-lg flex gap-5 md:gap-6 flex-col"
      >
        <div className="space-y-2">
          <label className="font-medium">Full Name</label>
          <input
            name="fullName"
            defaultValue={admin.fullName}
            required
            className="px-4 py-3 bg-primary-200 w-full rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={admin.email}
            className="px-4 py-3 bg-primary-200 w-full rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="font-medium">Telephone</label>
          <input
            name="telephone"
            type="tel"
            defaultValue={admin.telephone}
            required
            className="px-4 py-3 bg-primary-200 w-full rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* UPDATED: Full width button on mobile, auto width on desktop */}
        <div className="flex justify-end pt-2">
          <div className="w-full md:w-auto">
            <SubmitButton>Update Profile</SubmitButton>
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirm && (
        /* UPDATED: Added px-4 to ensure modal doesn't touch screen edges on tiny phones */
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-3 text-gray-900">
              Confirm Profile Update
            </h3>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Updating your profile (especially email) will log you out. You
              will need to sign in again.
            </p>

            {/* UPDATED: Stacked buttons on very small screens, side-by-side on larger */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Proceed & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
