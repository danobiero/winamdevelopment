import { UsersIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';

function CabinCard({ lesson }) {
  const { id, name, maxCapacity, regularPrice, discount, image, category } = lesson;
  const material = 'Included';
  const finalPrice =
    regularPrice && discount > 0 ? regularPrice - discount : null;


  return (
    <div className="w-full flex max-w-md flex-col border border-primary-200 rounded-lg overflow-hidden shadow-md">
      {/* Image Section */}
      <div className="relative w-full h-[220px]">
        <Image
          src={image || '/logo.png'}
          fill
          alt={`lesson ${name}`}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-col justify-between flex-grow">
        {/* Lesson Details */}
        <div className="pt-5 pb-4 px-7">
          <h3 className="text-blue-950 font-semibold text-xl sm:text-2xl mb-3 ml-0">
            {name}
          </h3>

          {/* Capacity & Price in Same Row */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            {/* Capacity */}
            <div className="flex gap-2 items-center px-3 py-1 bg-gray-200 rounded-full text-sm sm:text-base">
              <UsersIcon className="h-5 w-5 text-primary-800" />
              <p className="text-blue-950">
                Capacity <span className="font-bold">{maxCapacity}</span>{' '}
                Students
              </p>
            </div>

            {/* Price */}
            <div className="text-right inline-block bg-gray-200 rounded-full px-3 py-1 ">
              {finalPrice ? (
                <>
                  <span className="block sm:inline text-base sm:text-xl lg:text-2xl text-blue-950 font-semibold">
                    ${finalPrice}
                  </span>
                  <span className="block sm:inline ml-2 line-through font-medium text-primary-600 text-sm sm:text-base">
                    ${regularPrice}
                  </span>
                </>
              ) : (
                <span className="text-base sm:text-xl lg:text-2xl font-semibold">
                  {material}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Button */}
        <div className="bg-logo-10 border-t border-t-primary-200">
          <Link
            href={category === 1 ? `/lessons/${id}` : `/lessons/${id}`}
            aria-label={
              category === 1
                ? `View details and reserve lesson: ${name}`
                : `Download materials for lesson: ${name}`
            }
            className="block w-full text-center py-4 px-6 hover:bg-logo-100 transition-all hover:text-primary-900 text-sm sm:text-base"
          >
            
            {category === 1 ? 'Details & Reservation →' :  'Download →'}
          </Link>
        </div>
      </div>
    </div>
  );

  
}

export default CabinCard;
