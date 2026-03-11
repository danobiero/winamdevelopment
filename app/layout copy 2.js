import '@/app/_styles/globals.css';
import { Roboto } from 'next/font/google';
import Header from './_components/Header';
import { ReservationProvider } from './_components/ReservationContext';
import PWARegister from './_components/PWARegister';
import Footer from './_components/Footer';
import { headers } from 'next/headers';

export const viewport = {
  themeColor: '#2563eb',
};

export const metadata = {
  title: {
    template: 'Praxida - %s',
    default: 'Praxida - Practical Financial Foundation',
  },
  description: 'Financial Literacy based on practical financial foundations',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
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
    <html lang="en">
      <body
        className={`${roboto.className} antialiased text-primary-950 min-h-screen flex flex-col relative overflow-x-hidden`}
      >
        <PWARegister />

        {!isLanding && <Header />}

        {isLanding ? (
          children
        ) : (
          /* 1. Removed py-6 and sm:py-12 to sit flush against the Header */
          /* 2. Changed max-w-full to w-full */
          <div className="flex-1 px-4 sm:px-8 flex flex-col w-full">
            {/* 3. Removed max-w-7xl and mx-auto to use full width and remove top margin gaps */}
            <main className="w-full flex-1 pt-0">
              <ReservationProvider>{children}</ReservationProvider>
            </main>
          </div>
        )}

        {!isLanding && <Footer />}
      </body>
    </html>
  );
}
