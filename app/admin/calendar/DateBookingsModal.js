'use client';

export default function DateBookingsModal({ date, bookings = [], onClose }) {
  if (!date) return null;

  const now = new Date();

  const displayDate = new Date(date).toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* OVERLAY */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL CONTAINER */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Mobile Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Opportunity Windows
            </h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
              {displayDate}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENT PACK */}
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-8">
            No dynamic allocation windows for this date.
          </p>
        ) : (
          <div className="space-y-6">
            {bookings.map((ev) => {
              const start = new Date(ev.start_time);
              const end = new Date(ev.end_time);
              const isPast = start < now;

              return (
                <div
                  key={ev.id}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                >
                  {/* SESSION / SLOT KEY */}
                  <DetailRow
                    label="Schedule Window ID"
                    value={ev.session_key || '—'}
                  />

                  {/* INVESTMENT OPPORTUNITY NAME */}
                  <DetailRow
                    label="Investment Opportunity"
                    value={ev.title || ev.name || '—'}
                  />

                  {/* ACTIVE TIMEFRAME */}
                  <DetailRow
                    label="Active Call Time"
                    value={`${start.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })} – ${end.toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`}
                  />

                  {/* LINKED INVESTMENTS / SHAREHOLDERS */}
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      Committed Investors
                    </label>

                    {Array.isArray(ev.investments) &&
                    ev.investments.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {ev.investments.map((inv) => (
                          <li
                            key={inv.id}
                            className="text-sm font-semibold text-slate-800 bg-white border border-slate-100 rounded-lg px-3 py-2 flex justify-between items-center"
                          >
                            <span>
                              {inv.investorName || inv.shareholderName}
                            </span>
                            {inv.amount && (
                              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                {typeof inv.amount === 'number'
                                  ? `$${inv.amount.toLocaleString()}`
                                  : inv.amount}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400 italic">
                        No active capital allocations locked for this window.
                      </p>
                    )}
                  </div>

                  {/* ACTION FOOTER ROW */}
                  <div className="mt-6 flex gap-3">
                    {ev.meet_link && (
                      <button
                        onClick={() =>
                          !isPast && window.open(ev.meet_link, '_blank')
                        }
                        disabled={isPast}
                        className={`flex-[2] py-3 font-bold rounded-xl transition-all active:scale-95 text-sm
                          ${
                            isPast
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10'
                          }`}
                      >
                        {isPast ? 'Briefing Ended' : 'Join Briefing Room'}
                      </button>
                    )}

                    <button
                      onClick={onClose}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== LAYOUT COMPONENT HELPER ===================== */
function DetailRow({ label, value }) {
  return (
    <div className="border-b border-slate-200/60 pb-2 mb-3 last:mb-0 last:border-0 last:pb-0">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>
      <p className="text-base font-semibold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}
