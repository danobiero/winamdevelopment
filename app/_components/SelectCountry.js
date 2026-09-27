import { getCountries } from '@/app/_lib/data-service';
import { GlobeAmericasIcon } from '@heroicons/react/24/outline';

async function SelectCountry({
  defaultCountry = 'United States of America',
  name = 'nationality',
  id = 'nationality',
  className = '',
}) {
  const countries = await getCountries();

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600"
      >
        <GlobeAmericasIcon className="h-3.5 w-3.5 text-blue-600" />
        <span>Country / Nationality</span>
      </label>

      <div className="relative">
        <select
          name={name}
          id={id}
          required
          defaultValue={defaultCountry}
          className={`w-full px-3.5 py-2 sm:py-2.5 bg-slate-50/70 border border-slate-200 text-slate-900 font-medium text-xs sm:text-sm rounded-xl focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all cursor-pointer appearance-none pr-10 ${className}`}
        >
          <option value="">Select your country...</option>
          {countries.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default SelectCountry;
