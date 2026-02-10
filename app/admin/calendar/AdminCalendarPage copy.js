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
    <div className="px-4 md:px-8 lg:px-16 py-10 max-w-7xl mx-auto">
      {/* ===== BUTTON ROW ===== */}
      <div className="flex items-start gap-4 mb-6 flex-wrap">
        <SaveCalendarButton accessToken={accessToken} />
        <AssignBookingsButton />

        {!fullViewData ? (
          <FullViewButton onLoad={setFullViewData} />
        ) : (
          <BackToCalendarButton onBack={showCalendar} />
        )}
      </div>

      {/* ===== VIEW AREA (NO TITLE) ===== */}
      {!fullViewData ? (
        <CalendarGrid events={events} />
      ) : (
        <FullViewDisplay data={fullViewData} />
      )}
    </div>
  );
}
