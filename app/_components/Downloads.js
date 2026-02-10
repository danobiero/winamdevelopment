import {
  AcademicCapIcon,
  CalendarDaysIcon,
  EyeSlashIcon,
  MapPinIcon,
  UsersIcon,
} from '@heroicons/react/24/solid';
import Image from 'next/image';
import React from 'react';
import TextExpander from './TextExpander';

function Lesson({ lesson }) {
  const {
    id,
    name,
    maxCapacity,
    regularPrice,
    discount,
    image,
    description,
    curriculum,
    category,
  } = lesson;

  return (
    <div className="grid lg:grid-cols-[3fr_4fr] grid-cols-1 md:grid-cols-2 gap-10 border border-primary-200 rounded-xl py-3 px-10 mb-10">
      <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden rounded-xl">
        <Image
          src={image || '/logo.png'}
          fill
          className="object-cover"
          alt={`Cabin ${name}`}
          priority
        />
      </div>

      <div>
        <h3 className="flex items-center justify-center md:justify-start text-accent-100 font-black text-lg md:text-4xl rounded-lg mb-5 bg-primary-950 p-1 pb-1 md:translate-x-[-100px] md:w-[150%]">
          {name}
        </h3>

        <p className="text-lg text-primary-600 mb-10">{description}</p>

        <ul className="flex flex-col gap-4 mb-7">
          <li className="flex gap-3 items-center">
            <UsersIcon className="h-5 w-5 text-primary-600" />
            <span className="text-lg">
              For up to <span className="font-bold">{maxCapacity}</span>{' '}
              students
            </span>
          </li>

          <li className="flex gap-3 items-center">
            <MapPinIcon className="h-5 w-5 text-primary-600" />
            <span className="text-lg">
              Virtual <span className="font-bold">Google</span> (USA)
            </span>
          </li>

          <li className="flex gap-3 items-center">
            <EyeSlashIcon className="h-5 w-5 text-primary-600" />
            <span className="text-lg">
              Privacy <span className="font-bold">100%</span> guaranteed
            </span>
          </li>

          <li className="flex gap-3 items-center">
            <CalendarDaysIcon className="h-5 w-5 text-primary-600" />
            <span className="text-lg">
              Duration <span className="font-bold">6 Weeks</span>
            </span>
          </li>

          <li className="flex gap-3 items-center">
            <AcademicCapIcon className="h-5 w-5 text-primary-600" />
            <span className="text-lg">
              <span className="font-bold">Curriculum: </span>
              <TextExpander>{curriculum || ''}</TextExpander>
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Lesson;
