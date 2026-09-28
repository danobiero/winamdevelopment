'use client';

import { useState } from 'react';
import { updateProfileAdmin } from './profile_actions';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function UpdateProfileForm({ admin }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [telValue, setTelValue] = useState(admin?.telephone || '');

  if (!admin) return null;

  // Calculate initials for avatar
  const initials = (admin.fullName || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Live phone validation (9-12 digits)
  const isPhoneValid = /^[0-9]{9,12}$/.test(telValue.trim());

  // ===============================
  // CLIENT VALIDATION
  // ===============================
  const validate = (form) => {
    const fullName = form.get('fullName')?.trim();
    const email = form.get('email')?.trim();
    const telephone = form.get('telephone')?.trim();

    const newErrors = {};

    if (!fullName) newErrors.fullName = 'Full name is required';

    if (!email) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (!telephone) {
      newErrors.telephone = 'Telephone is required';
    } else {
      const phoneRegex = /^[0-9]{9,12}$/;
      if (!phoneRegex.test(telephone)) {
        newErrors.telephone = 'Telephone must be 9–12 digits';
      }
    }

    return newErrors;
  };

  // ===============================
  // OPEN CONFIRM MODAL
  // ===============================
  const handleSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const validationErrors = validate(form);

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setShowConfirm(false);
      return;
    }

    setFormData(form);
    setShowConfirm(true);
  };

  // ===============================
  // FINAL SUBMIT
  // ===============================
  const confirmSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await updateProfileAdmin(formData);

      if (!res?.success) {
        setShowConfirm(false);
        setErrors({
          form: res?.error || 'Update failed. Please try again.',
        });
        return;
      }

      // handle signout safely on client
      if (res.signOut) {
        window.location.href = '/admin-login';
      }
    } catch (err) {
      setShowConfirm(false);
      setErrors({
        form: err?.message || 'Unexpected error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* --- ADMIN IDENTITY CARD --- */}
      <div className="p-4 sm:p-6 bg-gradient-to-br from-[#000033] via-slate-900 to-blue-950 rounded-2xl sm:rounded-3xl text-white shadow-sm border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-xl sm:text-2xl font-black shadow-inner shrink-0 ring-4 ring-white/10">
          {initials || <UserIcon className="h-8 w-8 text-white" />}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-lg sm:text-xl font-black tracking-tight truncate max-w-full">
              {admin.fullName || 'Administrator'}
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              Active Admin
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 truncate">{admin.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs font-medium text-slate-400">
            {admin.id && (
              <span className="flex items-center gap-1">
                <IdentificationIcon className="h-3.5 w-3.5 text-blue-400" />
                Admin #{admin.id}
              </span>
            )}
            <span className="hidden sm:inline-block text-slate-500">•</span>
            <span className="flex items-center gap-1">
              <LockClosedIcon className="h-3 w-3 text-slate-400" />
              Level 1 Access
            </span>
          </div>
        </div>
      </div>

      {/* --- FORM CARD --- */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm border-b-4 border-b-slate-100 p-5 sm:p-8 space-y-6 sm:space-y-8"
      >
        {/* FORM TOP ERROR */}
        {errors.form && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl animate-in fade-in duration-200">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs sm:text-sm font-bold">Update Failed</p>
              <p className="text-xs text-rose-700">{errors.form}</p>
            </div>
          </div>
        )}

        {/* SECTION 1: CREDENTIALS */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-black text-[#000033] uppercase tracking-wider">
              Administrator Credentials
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Primary identification details associated with system operations
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="fullName"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                <UserIcon className="h-4 w-4 text-blue-600" />
                <span>Full Name</span>
              </label>

              <input
                id="fullName"
                name="fullName"
                defaultValue={admin.fullName}
                placeholder="e.g. Administrator Name"
                className={`w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                  errors.fullName
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-rose-600 font-medium">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
              >
                <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                <span>Email Address</span>
              </label>

              <input
                id="email"
                name="email"
                type="email"
                defaultValue={admin.email}
                placeholder="admin@winam.com"
                className={`w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                  errors.email
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-rose-600 font-medium">{errors.email}</p>
              )}
              <p className="text-xs text-slate-400 font-medium">
                Changing your email will update your sign-in username and 2FA destination.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: COMMUNICATION & TELEPHONE */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-black text-[#000033] uppercase tracking-wider">
              Security & Communications
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Contact number for administrative alerts and authentication
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Telephone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="telephone"
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  <PhoneIcon className="h-4 w-4 text-blue-600" />
                  <span>Telephone Number</span>
                </label>
                {telValue && (
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors ${
                      isPhoneValid
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-amber-700 bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {isPhoneValid ? 'Valid' : `${telValue.trim().length} digits`}
                  </span>
                )}
              </div>

              <input
                id="telephone"
                name="telephone"
                type="tel"
                value={telValue}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '');
                  setTelValue(cleaned);
                }}
                placeholder="e.g. 1234567890"
                className={`w-full px-4 py-3 sm:py-3.5 bg-slate-50/70 border text-slate-900 font-medium text-sm sm:text-base rounded-xl shadow-2xs hover:bg-white focus:bg-white focus:ring-4 outline-none transition-all placeholder:text-slate-400 ${
                  errors.telephone
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10'
                    : telValue && !isPhoneValid
                    ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500/10'
                    : 'border-slate-200 focus:border-blue-600 focus:ring-blue-600/10'
                }`}
              />
              {errors.telephone && (
                <p className="text-xs text-rose-600 font-medium">{errors.telephone}</p>
              )}
              <p className="text-xs text-slate-400 font-medium">
                Enter 9 to 12 digits without spaces or hyphens.
              </p>
            </div>
          </div>
        </div>

        {/* ACTION BAR */}
        <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-slate-400 text-center sm:text-left font-medium">
            Updating profile credentials will require signing in again.
          </p>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <SparklesIcon className="h-4 w-4 text-blue-200" />
            <span>Update Profile</span>
          </button>
        </div>
      </form>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-start justify-between">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-[#000033] uppercase tracking-tight">
                Confirm Profile Update
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Modifying your administrative contact details will update system security records. You will be signed out and redirected to sign in again with your updated credentials.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Email:</span>
                <span className="font-bold text-slate-800">{formData?.get('email')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Phone:</span>
                <span className="font-bold text-slate-800">{formData?.get('telephone')}</span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Confirm & Re-login'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
