import Image from 'next/image';
import image1 from '@/public/alt_logo.png';

export const metadata = {
  title: 'About Lessons',
};

export default function Page() {
  return (
    <div className="space-y-20">
      {/* TOP SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-x-12 gap-y-16 text-lg items-center">
        {/* Text content */}
        <div className="md:col-span-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-8 text-blue-400 font-semibold leading-tight text-center md:text-left">
            Vision and Purpose
          </h1>

          <div className="space-y-8">
            <p className="text-justify">
              Our mission is to empower individuals with clarity and confidence
              in their financial journey by providing accessible, foundational
              personal finance coaching and straightforward guidance through
              complex tax situations. We strive to simplify money matters.
            </p>

            <div className="mb-5 mt-5">
              <p className="text-xl mb-5 font-medium text-justify">
                "Building strength through clear, practical financial
                foundations" is our motto
              </p>
            </div>

            <p className="text-justify">
              We provide holistic, practical coaching in personal finance with a
              focus on building strong financial foundations. We believe that
              when individuals understand the basics, they make smarter
              financial choices.
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

      {/* TERMS & PRIVACY SECTION */}
      <div className="max-w-5xl mx-auto space-y-16 text-lg">
        {/* Terms and Conditions */}
        <section>
          <h2 className="text-3xl font-semibold text-blue-400 mb-6">
            Terms and Conditions
          </h2>

          <div className="space-y-5 text-justify">
            <p>
              By participating in our lessons, coaching sessions, and
              educational programs, you agree to use the materials and guidance
              provided for personal educational purposes only. Content,
              frameworks, and resources are intended to support learning and
              should not be interpreted as legal, tax, or investment advice.
            </p>

            <p>
              Program availability, pricing, and scheduling may change as we
              continue to improve the learning experience. We reserve the right
              to update lesson content, modify delivery formats, and adjust
              access policies to maintain quality and effectiveness.
            </p>

            <p>
              Participants are responsible for applying concepts in a manner
              that fits their personal financial situation. Individual results
              will vary based on effort, discipline, and circumstances.
            </p>
          </div>
        </section>

        {/* Privacy Statement */}
        <section>
          <h2 className="text-3xl font-semibold text-blue-400 mb-6">
            Privacy Statement
          </h2>

          <div className="space-y-5 text-justify">
            <p>
              We respect your privacy and are committed to protecting your
              personal information. Any data collected through lesson bookings,
              account creation, or communication is used solely to provide and
              improve your learning experience.
            </p>

            <p>
              Personal details such as your name, email address, and lesson
              participation history are stored securely and are never sold or
              shared with third parties for marketing purposes.
            </p>

            <p>
              Information may be used to manage lesson scheduling, provide
              educational materials, communicate updates, and improve program
              quality. By using this site and participating in lessons, you
              agree to the responsible collection and use of this information
              for operational purposes.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
