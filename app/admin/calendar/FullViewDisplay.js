'use client';

import { format } from 'date-fns';

export default function FullViewDisplay({ data }) {
  if (!Array.isArray(data)) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-center">
        Full View Error: Invalid data format.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 italic text-center">
        No grouped investment data available for this period.
      </div>
    );
  }

  // Consistent color mapping to match your Calendar Grid
  const opportunityColors = {
    1: 'bg-blue-50 text-blue-700 border-blue-200',
    2: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    default: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  return (
    /* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {data.map((row) => {
        // Since 1 event = 1 opportunity, we can grab the name and color from the first investment
        const firstInv = row.investments?.[0];
        const eventName =
          firstInv?.opportunity_name ||
          firstInv?.title ||
          'Scheduled Opportunity';
        const eventColorClass =
          opportunityColors[firstInv?.opportunity_id] ||
          opportunityColors.default;

        // Calculate Start and End times
        const start =
          row.start_time || row.created_at
            ? new Date(row.start_time || row.created_at)
            : null;
        // If your server action doesn't pass end_time, this defaults to exactly 1 hour later
        const end = row.end_time
          ? new Date(row.end_time)
          : start
            ? new Date(start.getTime() + 60 * 60 * 1000)
            : null;

        return (
          <div
            key={row.calendar_id || row.id}
            className="flex flex-col border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {/* Card Header (Date & ID) */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                ID: {String(row.calendar_id || row.id).slice(0, 5)}
              </span>
              {start && (
                <span className="text-sm font-bold text-slate-900">
                  {format(start, 'eeee, MMM do')}
                </span>
              )}
            </div>

            {/* Event Body */}
            <div className="p-4 flex flex-col gap-3">
              {/* Event / Opportunity Name & Time */}
              <div>
                <h3 className="text-base font-black text-slate-800 tracking-tight">
                  {eventName}
                </h3>
                {start && (
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {format(start, 'h:mm a')} –{' '}
                    {end ? format(end, 'h:mm a') : 'TBD'}
                  </p>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-3">
                  Committed Investors ({row.investments?.length || 0})
                </p>
              </div>

              {/* Shareholder List */}
              <div className="flex flex-col gap-2">
                {row.investments &&
                  row.investments.map((inv, idx) => (
                    <div
                      key={inv.investment_id || inv.id || idx}
                      className={`flex items-center p-2 rounded-lg border text-xs font-medium ${eventColorClass}`}
                    >
                      <span className="font-bold">
                        #{String(inv.investment_id || inv.id).slice(0, 5)}{' '}
                        {inv.shareholder_name ||
                          inv.shareholders?.fullName ||
                          'Unknown Investor'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
