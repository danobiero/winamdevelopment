import Link from "next/link";

function LoginMessage() {
  return (
    <div className='grid bg-logo-10 '>
      <p className='text-center text-xl py-12 self-center'>
        Please{' '}
        <Link href='/login' className='underline text-accent-50'>
          login
        </Link>{' '}
        to reserve these sessions
      </p>
    </div>
  );
}

export default LoginMessage;
