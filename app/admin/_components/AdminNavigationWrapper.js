import { getOpenSupportCount } from '../support/actions';
import AdminSideNavigation from '../side-navigation';

export default async function AdminNavigationWrapper() {
  const supportCount = await getOpenSupportCount().catch((err) => {
    console.warn('AdminNavigationWrapper getOpenSupportCount notice:', err.message);
    return 0;
  });

  return <AdminSideNavigation supportCount={supportCount || 0} />;
}
