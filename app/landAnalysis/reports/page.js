export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getPropertyReport } from '../_lib/actions';
import ReportTable from './ReportTable';

export default async function Page() {
  const data = await getPropertyReport();

  return <ReportTable data={data} />;
}
