'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCalendarToSupabase } from './actions';

export default function SyncCalendarButton({ accessToken }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleSync = () => {
    startTransition(async () => {
      setMessage('');

      try {
        const result = await saveCalendarToSupabase(accessToken);

        // 🔒 keep transition alive until revalidation completes
        await router.refresh();

        setMessage(`✅ Processed ${result.processed} events`);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Unknown error occurred';

        setMessage(`❌ Error: ${msg}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-all active:scale-95 whitespace-nowrap"
      >
        {isPending ? 'Syncing…' : 'Sync Google Calendar'}
      </button>

      {message && (
        <p
          className={`text-[11px] font-medium ${
            message.includes('❌') ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
