import { getCountries } from '@/app/_lib/data-service';

async function SelectCountry({
  defaultCountry = 'United States of America',
  name,
  id,
  className,
}) {
  const countries = await getCountries();

  // Find the flag based on the name
  const flag =
    countries.find((country) => country.name === defaultCountry)?.flag ?? '';

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="font-medium text-blue-950">
        Nationality
      </label>

      {/* The 'appearance-none' class (optional) can be added if you want to custom style 
        the arrow, but keeping standard browser behavior is often better for mobile accessibility.
      */}
      <select
        name={name}
        id={id}
        required
        defaultValue={`${defaultCountry}%${flag}`}
        /* We ensure the font-size is at least 16px (text-base) to prevent 
           iOS from auto-zooming on focus, which can be annoying for users. */
        className={`${className} text-base md:text-lg cursor-pointer transition-all focus:ring-2 focus:ring-primary-600 focus:outline-none`}
      >
        <option value="">Select your country...</option>
        {countries.map((c) => (
          <option key={c.name} value={`${c.name}%${c.flag}`}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SelectCountry;
