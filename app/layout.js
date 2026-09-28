import '@/app/_styles/globals.css';
import { Roboto } from 'next/font/google';
import Header from './_components/Header';
import { ReservationProvider } from './_components/ReservationContext';
import PWARegister from './_components/PWARegister';
import InstallPrompt from './_components/InstallPrompt';
import Footer from './_components/Footer';
import { headers } from 'next/headers';
import { ToastProvider } from '@/app/_lib/ToastContext';

export const viewport = { themeColor: '#2563eb' };

export const metadata = {
  title: {
    template: 'WINAM - %s',
    default:
      'WINAM -Strategic businesses driven by collective shareholders vision',
  },
  description: 'Strategic businesses driven by collective shareholders vision',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WINAM',
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
    <html lang="en" className="h-full">
      <body
        className={`${roboto.className} antialiased text-primary-950 h-dvh flex flex-col overflow-hidden`}
      >
        <PWARegister />
        <InstallPrompt />

        {!isLanding && (
          <div className="flex-none">
            <Header />
          </div>
        )}

        <div className="flex-1 flex flex-col w-full overflow-hidden bg-slate-50">
          <main className="w-full flex-1 overflow-y-auto flex flex-col">
            <ToastProvider> 
            <ReservationProvider>{children}</ReservationProvider>
            </ToastProvider>
          </main>
        </div>

        {!isLanding && (
          <div className="hidden md:block flex-none">
            <Footer />
          </div>
        )}
      </body>
    </html>
  );
}
