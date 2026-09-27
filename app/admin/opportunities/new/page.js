import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { createOpportunity } from '../actions';
import Link from 'next/link';
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/solid';

export const metadata = {
  title: 'Create Opportunity | Admin',
};

export default async function CreateOpportunityPage() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  // Optional: Set a default placeholder image if you have one in your new bucket
  const defaultImage =
    'https://qgkjifmsbwfjzowejmqn.supabase.co/storage/v1/object/public/winam_images/logo.png';

  const inputStyles =
    'w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 bg-white';
  const labelStyles = 'text-sm font-bold text-slate-700 ml-1 mb-1 block';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8 antialiased">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Create New <span className="text-blue-600">Opportunity</span>
        </h1>
        <Link
          href="/admin/opportunities"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mt-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Back to Opportunities</span>
        </Link>
      </div>

      <form
        action={createOpportunity}
        className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm"
      >
        {/* --- SECTION 1: BASIC INFO --- */}
        <div className="space-y-5">
          <div>
            <label className={labelStyles}>Opportunity Name</label>
            <input
              name="name"
              required
              type="text"
              className={inputStyles}
              placeholder="e.g. Austin Multi-Family Fund II"
            />
          </div>

          {/* Form Row: Financials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            <div>
              <label className={labelStyles}>Minimum Investment ($)</label>
              <input
                name="minimum_investment"
                type="number"
                step="0.01"
                min="0"
                required
                className={inputStyles}
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className={labelStyles}>Total Target ($)</label>
              <input
                name="total_value"
                type="number"
                step="0.01"
                min="0"
                className={inputStyles}
                placeholder="e.g. 5000000"
              />
            </div>
            <div>
              <label className={labelStyles}>Duration (Months)</label>
              <input
                name="duration_months"
                type="number"
                min="1"
                className={inputStyles}
                placeholder="e.g. 36"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className={labelStyles}>Category / Type</label>
              <select
                name="type"
                className={`${inputStyles} appearance-none`}
                required
                defaultValue="Real Estate"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.25rem',
                }}
              >
                <option value="Real Estate">Real Estate</option>
                <option value="Venture Capital">Venture Capital</option>
                <option value="Private Equity">Private Equity</option>
                <option value="Business Venture">Business Venture</option>
                <option value="Debt Fund">Debt Fund</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelStyles}>Expected Return (%)</label>
              <input
                name="expected_return"
                type="number"
                step="0.1"
                className={inputStyles}
                placeholder="e.g. 12.5"
              />
            </div>
          </div>

          {/* Featured Checkbox for Native Server Forms */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              name="is_featured"
              id="is_featured"
              value="true"
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
            />
            <label
              htmlFor="is_featured"
              className="text-sm font-bold text-slate-700 cursor-pointer"
            >
              Feature this opportunity on the dashboard
            </label>
          </div>
        </div>

        {/* --- SECTION 2: CONTENT --- */}
        <div className="space-y-5 pt-6 border-t border-slate-100">
          <div>
            <label className={labelStyles}>Short Description</label>
            <textarea
              name="description"
              rows={3}
              className={inputStyles}
              placeholder="Briefly describe the investment opportunity..."
            ></textarea>
          </div>

          <div>
            <label className={labelStyles}>Detailed Analysis</label>
            <textarea
              name="analysis"
              rows={5}
              className={`${inputStyles} font-normal text-sm`}
              placeholder="Provide a detailed breakdown of the opportunity (Separate paragraphs with double line breaks)..."
            ></textarea>
          </div>
        </div>

        <input type="hidden" name="image" value={defaultImage} />

        {/* Note on Images & Documents */}
        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-4 items-start">
          <PhotoIcon className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 font-medium leading-relaxed">
            <strong>Note:</strong> You can upload a cover image and attach PDF
            documents to this opportunity on the next screen after it has been
            created.
          </p>
        </div>

        {/* Submit button */}
        <div className="pt-4 flex justify-end border-t border-slate-100">
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-md active:scale-95"
          >
            Create Opportunity
          </button>
        </div>
      </form>
    </div>
  );
}
