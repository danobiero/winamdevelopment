import { getOpenSupportCount } from '../support/actions';
import AdminSideNavigation from '../side-navigation';

export default async function AdminNavigationWrapper() {
  const supportCount = await getOpenSupportCount();

  return <AdminSideNavigation supportCount={supportCount} />;
}
