import AdminNav from './_components/AdminNav';

export default function Layout({ children }) {
  return (
    <div>
      <AdminNav />
      <div className="p-6">{children}</div>
    </div>
  );
}
