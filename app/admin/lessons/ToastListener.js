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
      if (status)
        showToast(
          `Lesson ${status} successfully!`,
          status === 'activated' ? 'success' : 'warning'
        );
      if (created) showToast('Lesson created!', 'success');
      if (deleted) showToast('Lesson deleted.', 'warning');

      // Clean the URL: removes the ?status=... without reloading the page
      const params = new URLSearchParams(searchParams);
      params.delete('status');
      params.delete('created');
      params.delete('deleted');
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, showToast, pathname, replace]);

  return null;
}
