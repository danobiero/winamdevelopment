'use client';

import { useState } from 'react';
import SaveCalendarButton from './SaveCalendarButton';
import AssignBookingsButton from './AssignBookingsButton';
import FullViewButton from './FullViewButton';
import BackToCalendarButton from './BackToCalendarButton';
import CalendarGrid from './CalendarGrid';
import FullViewDisplay from './FullViewDisplay';

export default function AdminCalendarPage({ events, accessToken }) {
  const [fullViewData, setFullViewData] = useState(null);

  const showCalendar = () => setFullViewData(null);

  return (
    <div className="w-full px-2 md:px-4 py-4 md:py-6 bg-white min-h-screen">
      {/* ===== GLOBAL ACTION BAR ===== */}
      {/* This row stays at the top and doesn't repeat */}
      <div className="flex flex-wrap items-center gap-3 mb-8 w-full border-b pb-4">
        <SaveCalendarButton accessToken={accessToken} />
        <AssignBookingsButton />

        <div className="ml-auto">
          {!fullViewData ? (
            <FullViewButton onLoad={setFullViewData} />
          ) : (
            <BackToCalendarButton onBack={showCalendar} />
          )}
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="w-full">
        {!fullViewData ? (
          <CalendarGrid events={events} />
        ) : (
          <FullViewDisplay data={fullViewData} />
        )}
      </div>
    </div>
  );
}
