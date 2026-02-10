import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getLessons } from '../actions';
import UploadMaterials from '../UploadMaterials';

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const lessons = await getLessons();

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Upload Lesson Materials</h1>

      <UploadMaterials lessons={lessons} />
      
    </div>
  );
}
