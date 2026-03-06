import { auth } from '@/app/_lib/auth';
import SupportForm from './SupportForm';

export default async function SupportPage() {
  const session = await auth()

  return <SupportForm session={session} />;
}
