import { ClockIcon } from '@heroicons/react/24/outline';

export default function ReviewStep({ session }) {
  return (
    <div className="max-w-2xl mx-auto mt-20 p-12 bg-white border border-slate-200 rounded-3xl text-center shadow-xl">
      <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <ClockIcon className="h-10 w-10 text-primary-600 animate-pulse" />
      </div>
      <h2 className="text-3xl font-black text-primary-950 mb-4">
        Under Board Review
      </h2>
      <p className="text-slate-600 leading-relaxed mb-6">
        Thank you, {session?.user?.name}. Your application and fee payment have
        been received. The Winam Board of Directors is currently reviewing your
        profile.
      </p>
      <div className="inline-block px-4 py-2 bg-slate-100 rounded-full text-sm font-bold text-slate-500 uppercase tracking-widest">
        Step 3 of 7
      </div>
    </div>
  );
}
