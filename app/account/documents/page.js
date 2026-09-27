import { auth } from '@/app/_lib/auth';
import { getShareholderDocuments } from '@/app/_lib/data-service';
import DocumentsClient from './DocumentsClient';

export const metadata = {
  title: 'Documents',
};

export default async function Page() {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const documents = await getShareholderDocuments(session.user.shareholderId);

  return (
    <div className="w-full">
      <DocumentsClient initialDocuments={documents || []} />
    </div>
  );
}
