'use client';

export default function BookingModal({
  event, // single session (event click)
  date, // yyyy-MM-dd (date click)
  sessions = [], // sessions for a date (date click)
  onClose,
}) {
  if (!event && !date) return null;

  const now = new Date();
  const isSingleEvent = Boolean(event);

  const displayDate = new Date(
    isSingleEvent ? event.start_time : date
  ).toLocaleDateString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const renderSession = (ev) => {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    const hasEnded = now > end;

    const students = Array.isArray(ev.bookingDetails)
      ? ev.bookingDetails
      : Array.isArray(ev.bookings)
        ? ev.bookings
        : [];

    return (
      <div
        key={ev.id}
        className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50"
      >
        {/* SESSION INFO */}
        <div className="space-y-3">
          <DetailRow label="Session" value={ev.title || '—'} />
          <DetailRow
            label="Time"
            value={`${start.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })} – ${end.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}`}
          />
        </div>

        {/* STUDENTS */}
        <div className="mt-5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Confirmed Students
          </label>

          {students.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {students.map((b, idx) => (
                <li
                  key={b.id ?? idx}
                  className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
                >
                  {b.studentName ?? 'Unknown Student'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-400 italic px-1">
              No students booked.
            </p>
          )}
        </div>

        {/* ACTIONS - Responsive Flex Direction */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {ev.meet_link && (
            <button
              onClick={() => !hasEnded && window.open(ev.meet_link, '_blank')}
              disabled={hasEnded}
              className={`flex-[2] order-1 sm:order-none py-4 px-6 font-bold rounded-2xl transition-all active:scale-[0.98]
                ${
                  hasEnded
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700'
                }`}
            >
              {hasEnded ? 'Session Ended' : 'Join Meeting'}
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 order-2 sm:order-none py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 active:scale-[0.98] transition-all"
          >
            {isSingleEvent ? 'Close' : 'Back'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* MODAL / BOTTOM SHEET */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* MOBILE DRAG HANDLE */}
        <div className="pt-4 pb-2 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* HEADER */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {isSingleEvent ? 'Session' : 'Daily Schedule'}
            </h2>
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.15em]">
              {displayDate}
            </p>
          </div>

          <button
            onClick={onClose}
            className="hidden sm:flex p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {/* BODY - Scrollable area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-6 pb-4">
            {isSingleEvent ? (
              renderSession(event)
            ) : sessions.length > 0 ? (
              sessions.map(renderSession)
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-400 italic font-medium">
                  No sessions scheduled.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="group border-b border-gray-100 pb-2 last:border-0">
      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
        {label}
      </label>
      <p className="text-base font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
        {value}
      </p>
    </div>
  );
}
