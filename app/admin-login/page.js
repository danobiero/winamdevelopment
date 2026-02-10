import AdminSignInButton from '../_components/AdminSignInButton';

export default function AdminLoginPage() {
  return (
    <div className="flex flex-col items-center mt-20">
      <h2 className="text-3xl font-semibold mb-8">Admin Login</h2>
      <AdminSignInButton />
    </div>
  );
}
