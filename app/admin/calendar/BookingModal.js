'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UnpublishButton from './UnpublishButton';
import CancelSessionButton from './CancelSessionButton';
import Tooltip from './_components/Tooltip';

export default function BookingModal({
  event,
  date,
  dayOpportunities = [], // <-- NEW: Array of events for a clicked date
  investors = [],
  isLoading = false,
  error = null,
  onClose,
  onError,
  onAddAvailability,
  getLatestSessionLink,
}) {
  const router = useRouter();
  const [liveEvent, setLiveEvent] = useState(event);

  const now = new Date();
  const isSingleEvent = Boolean(event);

  // Sync incoming event prop down to local state safely
  useEffect(() => {
    setLiveEvent(event);
  }, [event]);

  // ================================================================
  // REACTIVE POLL: Automatically updates the UI when Google completes sync
  // ================================================================
  useEffect(() => {
    // Only poll if we are viewing a specific opportunity that needs a link
    if (
      !liveEvent ||
      liveEvent.meet_link ||
      !liveEvent.source_event_id ||
      !getLatestSessionLink
    ) {
      return;
    }

    // Fast loop: check database for updates every 2.5 seconds
    const interval = setInterval(async () => {
      const freshLink = await getLatestSessionLink(liveEvent.source_event_id);
      if (freshLink) {
        setLiveEvent((prev) => ({ ...prev, meet_link: freshLink }));
        router.refresh(); // Refresh client caches globally
        clearInterval(interval);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [liveEvent, getLatestSessionLink, router]);

  // ================================================================
  // EARLY RENDER RETURN PLACED SAFELY AFTER ALL REACT HOOKS
  // ================================================================
  if (!event && !date) return null;

  // Prevent timezone shift causing "yesterday" dates
  const safeDate = isSingleEvent
    ? new Date(liveEvent?.start_time || liveEvent?.created_at || new Date())
    : new Date(`${date}T00:00:00`);

  // Check if the selected date's day is entirely in the past
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isPastDate = safeDate < todayStart;

  const displayDate = safeDate.toLocaleDateString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Helper to render an opportunity card.
  // isDayView hides the investor list to keep the daily summary clean.
  const renderOpportunity = (ev, isDayView = false) => {
    if (!ev) return null;
    const start = new Date(ev.start_time || ev.created_at);
    // Fallback if end_time doesn't exist on opportunities
    const end = ev.end_time
      ? new Date(ev.end_time)
      : new Date(start.getTime() + 60 * 60 * 1000);
    const hasEnded = now > end;

    return (
      <div
        key={ev.id}
        className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 mb-4 shadow-sm"
      >
        {/* ===================== OPPORTUNITY WINDOW INFO ===================== */}
        <div className="space-y-3">
          <DetailRow
            label="Investment Opportunity"
            value={ev.title || ev.name || '—'}
          />

          <DetailRow
            label="Call Window Time"
            value={`${start.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })} – ${end.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
            })}`}
          />
        </div>

        {/* ===================== INVESTORS ===================== */}
        {isDayView ? (
          <div className="mt-5 p-4 bg-blue-50/30 rounded-xl border border-blue-100/50 text-center">
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              Investor Details Hidden in Day View
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Close this window and click the opportunity block directly on the
              calendar to load committed capital and investor data.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              Committed Investors
              {!isLoading && !error && (
                <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold">
                  {investors.length}
                </span>
              )}
            </label>

            {isLoading ? (
              <div className="mt-2 flex flex-col items-center justify-center py-6 bg-white/40 border border-dashed border-slate-200 rounded-xl">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-2" />
                <p className="text-xs text-slate-400 font-medium">
                  Loading investors...
                </p>
              </div>
            ) : error ? (
              <div className="mt-2 flex flex-col items-center justify-center py-4 px-3 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs text-rose-600 font-bold text-center">
                  {error}
                </p>
              </div>
            ) : investors.length > 0 ? (
              <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                      <tr>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Investor
                        </th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                          Status
                        </th>
                        <th className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investors.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                            {inv.shareholders?.fullName || 'Unknown Investor'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {inv.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {inv.amount_invested ? (
                              <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                ${Number(inv.amount_invested).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center justify-center py-6 bg-white/40 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400 font-medium">
                  Waiting for capital commitments...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===================== ACTIONS ===================== */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {ev.source_event_id &&
            (ev.status === 'published' || ev.status === 'exported') && (
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                <Tooltip text={'Remove session'}>
                  <UnpublishButton
                    eventId={ev.source_event_id}
                    onError={onError}
                    onSuccess={() => {
                      router.refresh();
                      onClose();
                    }}
                  />
                </Tooltip>

                <Tooltip text={'Permanently cancel'}>
                  <CancelSessionButton
                    eventId={ev.source_event_id}
                    onError={onError}
                    onSuccess={() => {
                      router.refresh();
                      onClose();
                    }}
                  />
                </Tooltip>
              </div>
            )}

          {ev.meet_link ? (
            <button
              onClick={() => !hasEnded && window.open(ev.meet_link, '_blank')}
              disabled={hasEnded}
              className={`flex-[2] py-4 px-6 font-bold rounded-2xl transition-all active:scale-[0.98] text-sm
                ${
                  hasEnded
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
                }`}
            >
              {hasEnded ? 'Briefing Ended' : 'Join Briefing Room'}
            </button>
          ) : ev.source_event_id ? (
            <div className="flex-[2] py-4 px-6 bg-amber-50 text-amber-600 text-xs font-bold rounded-2xl flex items-center justify-center border border-amber-100 animate-pulse">
              Briefing Link Pending...
            </div>
          ) : null}

          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200/80">
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">
              {isSingleEvent ? 'Allocation Info' : 'Date Schedule'}
            </h2>

            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-bold text-blue-600 uppercase">
                {displayDate}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 overflow-y-auto">
          {isSingleEvent ? (
            renderOpportunity(liveEvent, false)
          ) : dayOpportunities.length > 0 ? (
            <div className="space-y-4">
              {dayOpportunities.map((opp) => renderOpportunity(opp, true))}
            </div>
          ) : (
            /* EMPTY STATE FOR DATE CLICK */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                  isPastDate ? 'bg-slate-100' : 'bg-blue-50'
                }`}
              >
                <span className="text-3xl">{isPastDate ? '📜' : '🗓️'}</span>
              </div>

              {isPastDate ? (
                <>
                  <h3 className="text-xl font-black text-slate-700 uppercase tracking-tight">
                    Window Concluded
                  </h3>
                  <p className="mt-2 text-sm text-slate-400 font-medium max-w-[260px]">
                    No opportunities were published for this date horizon.
                  </p>
                  <div className="mt-8 w-full">
                    <button
                      onClick={onClose}
                      className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                    >
                      Close Log View
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    No Opportunities Scheduled
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 font-medium max-w-[240px]">
                    This date is wide open. Would you like to create a new
                    opportunity?
                  </p>
                  <div className="mt-8 w-full space-y-3">
                    <button
                      onClick={() => {
                        onClose();
                        onAddAvailability(new Date(`${date}T00:00:00`));
                      }}
                      className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] text-sm"
                    >
                      + Create Opportunity
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
                    >
                      Maybe Later
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
      <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
        {label}
      </label>
      <p className="text-base font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}
