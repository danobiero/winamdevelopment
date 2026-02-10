import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import UploadImages from './UploadImages';

export default async function UploadImage() {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Upload Lesson Materials</h1>

      <UploadImages/>
      
    </div>
  );
}
