'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/app/_lib/supabase-browser';

export default function MembershipRealtimeRefresh({ userId, children }) {
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    // Listen to changes in the membership_applications table
    const channel = supabaseBrowser
      .channel(`membership-refresh-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'membership_applications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          

          // 🔥 This is the magic: it tells Next.js to re-fetch
          // data in the parent Server Component.
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [userId, router]);

  return <>{children}</>;
}
