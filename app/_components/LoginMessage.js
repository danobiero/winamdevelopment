'use client';

import Link from 'next/link';

function LoginMessage() {
  return (
    <div className="grid bg-logo-10">
      <p className="text-center text-xl py-12 self-center">
        Please{' '}
        <Link href="/login" className="underline text-orange-100">
          login
        </Link>{' '}
        to access investing and membership features
      </p>
    </div>
  );
}

export default LoginMessage;
