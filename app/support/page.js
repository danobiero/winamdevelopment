import { auth } from '@/app/_lib/auth';
import SupportForm from './SupportForm';

export const metadata = {
  title: 'Customer Support',
};

export default async function SupportPage() {
  const session = await auth();

  return <SupportForm session={session} />;
}
