import {
  UsersIcon,
  ArrowRightIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

function CabinCard({ lesson }) {
  const { id, name, maxCapacity, regularPrice, discount, image, category } =
    lesson;
  const material = 'Included';
  const finalPrice =
    regularPrice && discount > 0 ? regularPrice - discount : null;

  return (
    <div className="group w-full flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative w-full h-[240px] overflow-hidden">
        <Image
          src={image || '/logo.png'}
          fill
          alt={`lesson ${name}`}
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
        {discount > 0 && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Save ${discount}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-grow">
        <div className="flex-grow p-7 pb-5">
          <h3 className="text-slate-900 font-bold text-2xl mb-6 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>

          {/* Metadata Row: Space-Between logic */}
          <div className="flex items-center justify-between gap-4">
            {/* Left Justified: Capacity */}
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-slate-700 text-sm border border-slate-200/50">
              <UsersIcon className="h-5 w-5 text-blue-600" />
              <span className="whitespace-nowrap">
                Capacity <span className="font-bold">{maxCapacity}</span>{' '}
                Students
              </span>
            </div>

            {/* Right Justified: Price */}
            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg border border-slate-200/50">
              {finalPrice ? (
                <>
                  <span className="text-lg font-black text-slate-900">
                    ${finalPrice}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ${regularPrice}
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold text-blue-600 uppercase tracking-widest whitespace-nowrap">
                  {material}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button: End-to-End */}
        <div className="mt-auto border-t border-slate-100">
          <Link
            href={`/lessons/${id}`}
            aria-label={
              category === 1
                ? `View details and reserve lesson: ${name}`
                : `Download materials for lesson: ${name}`
            }
            className="flex items-center justify-center gap-2 w-full py-5 bg-logo-10 hover:bg-logo-100 text-slate-900 font-bold text-sm transition-all uppercase tracking-widest"
          >
            {category === 1 ? (
              <>
                Details & Reservation
                <ArrowRightIcon className="h-4 w-4" />
              </>
            ) : (
              <>
                Download Resources
                <ArrowDownTrayIcon className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CabinCard;
