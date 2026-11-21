// page.js
import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getOpportunities } from '../actions';
import UploadDocuments from '../UploadDocuments';

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const opportunities = await getOpportunities();

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
        Upload Opportunity <span className="text-blue-600 dark:text-blue-400">Documents</span>
      </h1>

      <UploadDocuments opportunities={opportunities} />
    </div>
  );
}
