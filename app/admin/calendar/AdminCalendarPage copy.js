'use client';

import { useState, useEffect, useTransition } from 'react';
import { reconcileGoogleCancellations } from './actions'; // Import the new action

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

// Simple Sync Icon component
const SyncIcon = ({ isPending }) => (
  <svg
    className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
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
  // Changed from false to null to better handle the state object { initialDate }
  const [showCreate, setShowCreate] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [isSyncing, startSync] = useTransition();

  const showCalendar = () => setFullViewData(null);

  // LOGIC FIX: Check if a date was passed (from BookingModal) or if it's a direct button click
  const openCreate = (date) => {
    if (date instanceof Date || (typeof date === 'string' && date.length > 0)) {
      setShowCreate({ initialDate: new Date(date) });
    } else {
      setShowCreate(true);
    }
  };

  const closeCreate = () => setShowCreate(null);

  // --- RECONCILIATION LOGIC ---
  const runSync = () => {
    startSync(async () => {
      const result = await reconcileGoogleCancellations();
      if (result.ok) {
        if (result.cancelledLocally > 0) {
          setActionError({
            message: `Successfully synced ${result.cancelledLocally} external cancellation(s).`,
            severity: 'success',
          });
        } else {
          setActionError({
            message: 'Calendar is already up to date.',
            severity: 'success',
          });
        }
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
    <div className="w-full px-2 md:px-4 py-4 md:py-6 bg-white min-h-screen">
      {/* ===== GLOBAL ACTION BAR ===== */}
      <div className="flex flex-wrap items-center gap-3 mb-6 w-full border-b pb-4">
        <Tooltip text="Date and time when sessions are delivered">
          <CreateEventButton onClick={() => openCreate()} />
        </Tooltip>

        <Tooltip text="Publish events to calendar">
          <PublishCalendarButton onError={setActionError} />
        </Tooltip>

        <Tooltip text={'Link bookings to calendar sessions'}>
          <AssignBookingsButton onError={setActionError} />
        </Tooltip>

        <Tooltip text={'Move events to google calendar'}>
          <SyncCalendarButton
            accessToken={accessToken}
            onError={setActionError}
          />
        </Tooltip>

        <Tooltip text={'Get Session Meeting Links'}>
          <MeetingLinkSync onError={setActionError} />
        </Tooltip>

        <Tooltip text="Sync external Google deletions">
          <button
            onClick={runSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <SyncIcon isPending={isSyncing} />
            <span className="hidden sm:inline">
              {isSyncing ? 'Syncing...' : 'Reconcile Google'}
            </span>
          </button>
        </Tooltip>

        <div className="ml-auto">
          {!fullViewData ? (
            <Tooltip text={'View session bookings'}>
              <FullViewButton onLoad={setFullViewData} />
            </Tooltip>
          ) : (
            <BackToCalendarButton onBack={showCalendar} />
          )}
        </div>
      </div>

      <AdminErrorBanner
        error={actionError}
        onDismiss={() => setActionError(null)}
      />

      {/* ===== CONTENT AREA ===== */}
      <div className="w-full">
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

      {/* ===== CREATE EVENT MODAL ===== */}
      {showCreate && (
        <CreateEventModal
          lessons={lessons}
          adminId={adminId}
          onClose={closeCreate}
          // Pass the initialDate if it exists in our state object
          initialDate={showCreate?.initialDate}
        />
      )}
    </div>
  );
}
