import '@/app/_styles/globals.css';
import { Roboto } from 'next/font/google';
import Header from './_components/Header';
import { ReservationProvider } from './_components/ReservationContext';
import PWARegister from './_components/PWARegister';
import Footer from './_components/Footer';
import { headers } from 'next/headers';

export const viewport = { themeColor: '#2563eb' };

export const metadata = {
  title: {
    template: 'Praxida - %s',
    default: 'Praxida - Practical Financial Foundation',
  },
  description: 'Financial Literacy based on practical financial foundations',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.png', apple: '/icon-192.png' },
};

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
});

export default function RootLayout({ children }) {
  const pathname = headers().get('x-pathname') || '';
  const isLanding = pathname === '/';

  return (
    <html lang="en" className="h-full">
      <body
        className={`${roboto.className} antialiased text-primary-950 h-dvh flex flex-col overflow-hidden`}
      >
        <PWARegister />

        {!isLanding && (
          <div className="flex-none">
            <Header />
          </div>
        )}

        <div className="flex-1 flex flex-col w-full overflow-hidden bg-slate-50">
          <main className="w-full flex-1 overflow-y-auto flex flex-col">
            <ReservationProvider>{children}</ReservationProvider>
          </main>
        </div>

        {/* 1. hidden: Removes footer on small screens.
           2. md:block: Brings it back on desktop.
           3. flex-none: Maintains structural height.
        */}
        {!isLanding && (
          <div className="hidden md:block flex-none">
            <Footer />
          </div>
        )}
      </body>
    </html>
  );
}