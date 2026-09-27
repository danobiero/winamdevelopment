'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import FeesPaymentButton from './FeesPaymentButton';

export default function PaymentStep({ session, fee }) {

  if (!fee) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-semibold text-slate-600">
          Preparing fee details...
        </h2>
        <p className="text-slate-400 mt-2">Connecting to Winam Treasury…</p>
      </div>
    );
  }

  const amount = Number(fee.amount).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 md:p-12 text-center">
      <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
      </div>

      <h2 className="text-3xl font-black text-primary-950 mb-2">
        Application Received!
      </h2>

      <p className="text-slate-600 mb-8">
        Your details are in our system. To proceed to Board Review, please pay
        the one-time administrative processing fee.
      </p>

      {/* Summary Card */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">{fee.name}</span>
          <span className="font-bold text-slate-900">${amount}</span>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
          <span className="font-bold text-primary-950">Total Due</span>
          <span className="font-black text-primary-950">${amount}</span>
        </div>
      </div>

      {/* Payment Action */}
      <div className="w-full">
        <FeesPaymentButton
          feeId={fee.id}
          email={session?.user?.email}
          shareholderId={session?.user?.shareholderId}
          amount={amount}
        />
      </div>

      <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest">
        Secure Payment via Winam Treasury
      </p>
    </div>
  );
}
