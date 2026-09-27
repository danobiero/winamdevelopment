// app/auth/error/page.js
'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthErrorPage() {
  const params = useSearchParams();
  const error = params.get('error');

  let message = 'Something went wrong. Please try again.';

  if (error === 'AccessDenied') {
    message = 'Login was cancelled.';
  }

  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">{message}</h1>
        <p className="text-gray-500">You can try logging in again.</p>
      </div>
    </div>
  );
}
