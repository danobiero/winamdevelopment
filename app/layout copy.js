
import '@/app/_styles/globals.css';

export const metadata = {
  title: {
    template: 'Praxida - %s',
    default: 'Praxida - Practical Financial Foundation',
  },
  description: 'Financial Literacy based on practical financial foundations',
};

import { Roboto } from 'next/font/google';
import Header from './_components/Header';
import { ReservationProvider } from './_components/ReservationContext';

const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  weight: '400',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${roboto.className}antialiased text-primary-950 min-h-screen flex flex-col relative`}
      >
        <Header />

        <div className="flex-1 px-8 py-12 grid">
          <main className="max-w-7xl mx-auto w-full">
            <ReservationProvider>{children}</ReservationProvider>
          </main>
        </div>
      </body>
    </html>
  );
}
