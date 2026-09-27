import { auth } from '@/app/_lib/auth';
import { getUserProfile, getShareholderPaymentMethod } from '@/app/_lib/data-service';
import PaymentForm from './PaymentForm';

export const metadata = {
  title: 'Payment Information',
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const user = await getUserProfile();
  const paymentMethod = await getShareholderPaymentMethod(user.id);

  return (
    <div className="w-full min-h-full lg:h-full flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
            Payment <span className="text-blue-600 dark:text-blue-400">Information</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            This is how Winam will disburse funds when payments or dividends are required.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold shadow-2xs">
            {paymentMethod ? `Active: ${paymentMethod.payment_type?.toUpperCase()}` : 'No Payment Rail Set'}
          </span>
        </div>
      </header>

      {/* Form Content */}
      <div className="flex-1 flex flex-col lg:min-h-0">
        <PaymentForm paymentMethod={paymentMethod} user={user} />
      </div>
    </div>
  );
}
