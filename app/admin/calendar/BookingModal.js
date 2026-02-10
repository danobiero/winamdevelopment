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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderSession = (ev) => {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    const isPast = start < now;

    // 🔑 SUPPORT BOTH BACKEND SHAPES
    const students = Array.isArray(ev.bookingDetails)
      ? ev.bookingDetails
      : Array.isArray(ev.bookings)
        ? ev.bookings
        : [];

    return (
      <div key={ev.id} className="border rounded-xl p-4 bg-gray-50">
        {/* SESSION INFO */}
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

        {/* STUDENTS */}
        <div className="mt-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
            Students
          </label>

          {students.length > 0 ? (
            <ul className="mt-2 space-y-1">
              {students.map((b, idx) => (
                <li
                  key={b.id ?? idx}
                  className="text-sm font-semibold text-gray-800 bg-white border rounded-lg px-3 py-2"
                >
                  {b.studentName ?? 'Unknown Student'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-400 italic">
              No students booked.
            </p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex gap-3">
          {ev.meet_link && (
            <button
              onClick={() => !isPast && window.open(ev.meet_link, '_blank')}
              disabled={isPast}
              className={`flex-[2] py-3 font-bold rounded-xl transition-all
                ${
                  isPast
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {isPast ? 'Session Ended' : 'Join Meeting'}
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* HANDLE */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              Session Details
            </h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              {displayDate}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="space-y-6">
          {isSingleEvent ? (
            renderSession(event)
          ) : sessions.length > 0 ? (
            sessions.map(renderSession)
          ) : (
            <p className="text-sm text-gray-500 italic text-center">
              No sessions for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== HELPER ===================== */
function DetailRow({ label, value }) {
  return (
    <div className="border-b border-gray-200 pb-2">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
        {label}
      </label>
      <p className="text-base font-semibold text-gray-800">{value}</p>
    </div>
  );
}
