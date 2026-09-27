import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getOpportunityById, getAllOpportunityImages } from '../actions';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import EditOpportunityWrapper from './EditOpportunityWrapper'; // We will need to translate this next!

export default async function EditOpportunityPage({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  // Await the dynamic params if you are using Next.js 15+ (optional for Next 14 but good practice)
  const resolvedParams = await params;

  // 1. Fetch the specific opportunity and its attached documents
  const { opportunity, materials: documents } =
    (await getOpportunityById(resolvedParams.id)) || {};

  // 2. Fetch the global image library (for the image selection dropdown/grid in the form)
  const imagesRes = await getAllOpportunityImages();
  const images = imagesRes.data || [];

  if (!opportunity) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Opportunity Not Found
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          The opportunity you are trying to edit may have been deleted or moved.
        </p>
      </div>
    );
  }

  return (
    /* RESPONSIVE CONTAINER:
       - Mobile: Full width with horizontal padding (px-4), reduced top padding (py-4)
       - Desktop (sm+): max-w-3xl and py-10 for a centered, spacious look
    */
    <div className="max-w-3xl mx-auto px-4 py-4 sm:px-0 sm:py-10 antialiased">
      <div className="mb-8 px-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Edit <span className="text-blue-600">Opportunity</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-500 font-medium mt-2 leading-relaxed">
          <span className="block sm:inline">
            Update the details and financial parameters for:
          </span>
          <span className="text-blue-600 block sm:inline sm:ml-1 font-bold break-words">
            "{opportunity.name}"
          </span>
        </p>
      </div>

      <EditOpportunityWrapper
        opportunity={opportunity}
        images={images}
        documents={documents}
      />
    </div>
  );
}
