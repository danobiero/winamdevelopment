'use client';

import { useState, useEffect, useTransition } from 'react';
import { reconcileGoogleCancellations } from './actions';

import SyncCalendarButton from './SyncCalendarButton';
import PublishCalendarButton from './PublishCalendarButton';
import AssignBookingsButton from './AssignBookingsButton';
import FullViewButton from './FullViewButton';
import BackToCalendarButton from './BackToCalendarButton';
import CalendarGrid from './CalendarGrid';
import FullViewDisplay from './FullViewDisplay';
import CreateEventButton from './CreateEventButton';
import CreateEventModal from './CreateEventModal';
import AdminErrorBanner from '../AdminErrorBanner';
import MeetingLinkSync from './MeetingLinkSync';
import Tooltip from './_components/Tooltip';

// Updated Sync Icon with higher stroke weight for the admin aesthetic
const SyncIcon = ({ isPending }) => (
  <svg
    className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

export default function AdminCalendarPage({
  events = [],
  accessToken,
  lessons = [],
  adminId,
}) {
  const [fullViewData, setFullViewData] = useState(null);
  const [showCreate, setShowCreate] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isSyncing, startSync] = useTransition();

  const showCalendar = () => setFullViewData(null);

  const openCreate = (date) => {
    if (date instanceof Date || (typeof date === 'string' && date.length > 0)) {
      setShowCreate({ initialDate: new Date(date) });
    } else {
      setShowCreate(true);
    }
  };

  const closeCreate = () => setShowCreate(null);

  const runSync = () => {
    startSync(async () => {
      const result = await reconcileGoogleCancellations();
      if (result.ok) {
        setActionError({
          message:
            result.cancelledLocally > 0
              ? `Synced ${result.cancelledLocally} external cancellation(s).`
              : 'Calendar is already up to date.',
          severity: 'success',
        });
      } else {
        setActionError({
          message: `Sync failed: ${result.error}`,
          severity: 'error',
        });
      }
    });
  };

  useEffect(() => {
    runSync();
  }, []);

  useEffect(() => {
    if (actionError?.severity === 'success') {
      const timer = setTimeout(() => setActionError(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  return (
    <div className="w-full bg-white">
      {/* ===== GLOBAL ACTION BAR ===== */}
      <div className="flex flex-wrap items-center gap-2 p-4 md:p-6 border-b border-slate-100 bg-slate-50/30">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Tooltip text="Date and time when sessions are delivered">
            <CreateEventButton onClick={() => openCreate()} />
          </Tooltip>

          <Tooltip text="Publish events to calendar">
            <PublishCalendarButton onError={setActionError} />
          </Tooltip>

          <Tooltip text="Link bookings to calendar sessions">
            <AssignBookingsButton onError={setActionError} />
          </Tooltip>

          <Tooltip text="Move events to google calendar">
            <SyncCalendarButton
              accessToken={accessToken}
              onError={setActionError}
            />
          </Tooltip>

          <Tooltip text="Get Session Meeting Links">
            <MeetingLinkSync onError={setActionError} />
          </Tooltip>

          {/* Reconcile Button Styled for Admin Aesthetic */}
          <Tooltip text="Sync with Google calendar">
            <button
              onClick={runSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-600 rounded-lg shadow-sm transition-all disabled:opacity-50 active:scale-95"
            >
              <SyncIcon isPending={isSyncing} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                {isSyncing ? 'Syncing' : 'Reconcile'}
              </span>
            </button>
          </Tooltip>
        </div>

        {/* View Toggles */}
        <div className="ml-auto pl-4 border-l border-slate-200">
          {!fullViewData ? (
            <Tooltip text="View session bookings">
              <FullViewButton onLoad={setFullViewData} />
            </Tooltip>
          ) : (
            <BackToCalendarButton onBack={showCalendar} />
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 py-4">
        <AdminErrorBanner
          error={actionError}
          onDismiss={() => setActionError(null)}
        />

        {/* ===== CONTENT AREA ===== */}
        <div className="w-full mt-2">
          {!fullViewData ? (
            <CalendarGrid
              events={events}
              onError={setActionError}
              onAddAvailability={openCreate}
            />
          ) : (
            <FullViewDisplay data={fullViewData} />
          )}
        </div>
      </div>

      {/* ===== CREATE EVENT MODAL ===== */}
      {showCreate && (
        <CreateEventModal
          lessons={lessons}
          adminId={adminId}
          onClose={closeCreate}
          initialDate={showCreate?.initialDate}
        />
      )}
    </div>
  );
}
