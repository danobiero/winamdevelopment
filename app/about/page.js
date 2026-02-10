import Image from 'next/image';
import image1 from '@/public/alt_logo.png';


export const metadata = {
  title: 'About Lessons',
};
/* 
export default function Page() {
  return (
    <div className="grid grid-cols-5 gap-x-24 gap-y-32 text-lg items-center">
      <div className="col-span-3">
        <h1 className="text-4xl mb-10 text-blue-400 font-medium">
          Vision and Purpose
        </h1>

        <div className="space-y-8">
          <p>
            Our mission is to empower individuals with clarity and confidence in
            their financial journey by providing accessible, foundational
            personal finance coaching and straightforward guidance through
            complex tax situations. We strive to simplify money matters.
          </p>
          <div className="mb-5 mt-5">
            <p className="text-xl mb-5 font-medium">
              "Building strength through clear, practical financial
              foundations"...is our motto
            </p>
          </div>
          <p>
            We will provide holistic, practical coaching in personal finance
            with a focus on building strong financial foundations. We believe
            that when individuals understand the basics, they make smarter
            financial choices.
          </p>
        </div>
      </div>

      <div className="col-span-2">
        <Image
          src={image1}
          alt="smilling lady for about page"
          placeholder="blur"
          quality={80}
        />
      </div>
    </div>
  );
}
 */

export default function Page() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-x-12 gap-y-16 text-lg items-center ">
      {/* Text content */}
      <div className="md:col-span-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-8 text-blue-400 font-semibold leading-tight text-center md:text-left">
          Vision and Purpose
        </h1>

        <div className="space-y-8">
          <p className="text-justify">
            Our mission is to empower individuals with clarity and confidence in
            their financial journey by providing accessible, foundational
            personal finance coaching and straightforward guidance through
            complex tax situations. We strive to simplify money matters.
          </p>
          <div className="mb-5 mt-5">
            <p className="text-xl mb-5 font-medium text-justify">
              "Building strength through clear, practical financial foundations"
              is our motto
            </p>
          </div>
          <p className="text-justify">
            We provide holistic, practical coaching in personal finance with a
            focus on building strong financial foundations. We believe that when
            individuals understand the basics, they make smarter financial
            choices.
          </p>
        </div>
      </div>

      {/* Image */}
      <div className="md:col-span-2 flex justify-center">
        <Image
          src={image1}
          alt="smiling lady for about page"
          placeholder="blur"
          quality={80}
          className="rounded-2xl object-cover"
        />
      </div>
    </div>
  );
}
