import Image from 'next/image';
import Link from 'next/link';
import alt_logo_2 from '@/public/office_1.jpg';
import gradient from '@/public/office_2.jpg';

export default function Page() {
  return (
    <div>
      <main className="mt-24">
        {/* Background Image for small screens */}
        <div className="absolute inset-0 sm:hidden">
          <Image
            src={gradient}
            fill
            className="object-cover object-top"
            placeholder="blur"
            alt="gradient background"
          />
        </div>

        {/* Background Image for larger screens */}
        <div className="absolute inset-0 hidden sm:flex justify-center">
          <Image
            src={alt_logo_2}
            fill
            className="object-cover object-center"
            placeholder="blur"
            quality={80}
            alt="students logo"
          />
        </div>

        <div className="relative z-10 text-center justify-center h-full px-4">
          <h1 className="text-7xl md:text-7xl lg:text-8xl text-blue-950 mb-10 tracking-tight font-normal flex flex-col items-center">
            Welcome
          </h1>
          <Link
            href="/lessons"
            className="bg-logo-10 text-blue-950 font-semibold hover:text-logo-100 transition-all md:text-xl text-lg px-8 py-6  rounded-lg"
          >
            Explore Lessons
          </Link>
        </div>
      </main>
    </div>
  );
}
