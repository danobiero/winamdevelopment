import SupportForm from '../SupportForm';
import Link from 'next/link';
import { auth } from '@/app/_lib/auth';

export default async function NewTicketPage() {
  const session = await auth();
  const shareholder = session.user;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <Link
          href="/account/support"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-4"
        >
          ← Back to Requests
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          New <span className="text-blue-600 dark:text-blue-400">Support Request</span>
        </h1>

        <p className="text-slate-500 mt-2">
          Tell us what's going on and we'll get back to you as soon as possible.
        </p>
      </div>

      <SupportForm shareholder={shareholder} />
    </div>
  );
}
