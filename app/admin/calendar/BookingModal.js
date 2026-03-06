'use client';

import UnpublishButton from './UnpublishButton';
import CancelSessionButton from './CancelSessionButton';
import Tooltip from './_components/Tooltip';

export default function BookingModal({
  event,
  date,
  sessions = [],
  onClose,
  onError,
  onAddAvailability,
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
        className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 mb-4 last:mb-0 shadow-sm"
      >
        {/* ===================== SESSION INFO ===================== */}
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

        {/* ===================== STUDENTS ===================== */}
        <div className="mt-5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            Confirmed Students
            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-md text-[9px]">
              {students.length}
            </span>
          </label>

          {students.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {students.map((b, idx) => (
                <li
                  key={b.id ?? idx}
                  className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-blue-200 transition-colors"
                >
                  {b.studentName ?? 'Unknown Student'}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-2 flex flex-col items-center justify-center py-6 bg-white/40 border border-dashed border-gray-200 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">
                Waiting for bookings...
              </p>
            </div>
          )}
        </div>

        {/* ===================== ACTIONS ===================== */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {ev.source_event_id &&
            (ev.status === 'published' || ev.status === 'exported') && (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Tooltip text={'Remove session'}>
                  <UnpublishButton
                    eventId={ev.source_event_id}
                    onError={onError}
                    onSuccess={onClose}
                  />
                </Tooltip>
                <Tooltip text={'Permanently cancel'}>
                  <CancelSessionButton
                    eventId={ev.source_event_id}
                    onError={onError}
                    onSuccess={onClose}
                  />
                </Tooltip>
              </div>
            )}

          {ev.meet_link ? (
            <button
              onClick={() => !hasEnded && window.open(ev.meet_link, '_blank')}
              disabled={hasEnded}
              className={`flex-[2] py-4 px-6 font-bold rounded-2xl transition-all active:scale-[0.98]
                ${hasEnded ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'}`}
            >
              {hasEnded ? 'Session Ended' : 'Join Meeting'}
            </button>
          ) : (
            <div className="flex-[2] py-4 px-6 bg-amber-50 text-amber-600 text-xs font-bold rounded-2xl flex items-center justify-center border border-amber-100">
              Meeting Link Pending
            </div>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
          >
            {isSingleEvent ? 'Close' : 'Back'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">
              {isSingleEvent ? 'Session Info' : 'Daily Schedule'}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-blue-600 uppercase">
                {displayDate}
              </p>
              {!isSingleEvent && sessions.length === 0 && (
                <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">
                  Empty
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 overflow-y-auto">
          {isSingleEvent || sessions.length > 0 ? (
            isSingleEvent ? (
              renderSession(event)
            ) : (
              sessions.map(renderSession)
            )
          ) : (
            /* EMPTY STATE UI - THE FIX FOR THE "UGLY BOX" */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl">🗓️</span>
              </div>

              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">
                No Lessons Scheduled
              </h3>
              <p className="mt-2 text-sm text-gray-500 font-medium max-w-[240px]">
                This date is wide open. Would you like to add availability?
              </p>

              <div className="mt-8 w-full space-y-3">
                <button
                  onClick={() => {
                    onClose(); // 1. Close the "Empty" modal
                    onAddAvailability(date); // 2. Trigger the "Create" modal in the parent
                  }}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                >
                  + Add Availability
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-gray-100 pb-2">
      <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
        {label}
      </label>
      <p className="text-base font-bold text-gray-800">{value}</p>
    </div>
  );
}
