import AdminSignInButton from '../_components/AdminSignInButton';
import SignInButton from '../_components/SignInButton';

export const metadata = {
  title: 'Login',
};

export default function Page() {
  return (
    
    <div className="flex flex-col gap-10 mt-16 md:mt-24 items-center px-6 text-center">
    
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
        Start your learning journey
      </h2>

    
      <div className="flex flex-col gap-4 w-full max-w-xs sm:max-w-sm">
        <SignInButton />
        <AdminSignInButton />
        
      </div>

      <p className="text-sm text-primary-600 opacity-70">
        Gmail is all you need to get the sessions
      </p>
    </div>
  );
}
