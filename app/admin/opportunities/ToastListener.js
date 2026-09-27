'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/app/_lib/ToastContext';

export default function ToastListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    const status = searchParams.get('status');
    const created = searchParams.get('created');
    const deleted = searchParams.get('deleted');

    if (status || created || deleted) {
      if (status) {
        // Checks for 'active' or 'activated' to ensure the green success toast fires correctly
        const isSuccess = status === 'activated' || status === 'active';
        showToast(
          `Opportunity ${status} successfully!`,
          isSuccess ? 'success' : 'warning'
        );
      }

      if (created) showToast('Opportunity created!', 'success');
      if (deleted) showToast('Opportunity deleted.', 'warning');

      // Clean the URL: removes the query params without reloading the page
      const params = new URLSearchParams(searchParams);
      params.delete('status');
      params.delete('created');
      params.delete('deleted');

      // Preserve any other query parameters (like ?page=2)
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, showToast, pathname, replace]);

  return null;
}
