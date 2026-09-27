'use server';

import { auth } from '@/app/_lib/auth';
import { getGoogleCalendarEvents } from '@/app/_lib/google-calendar';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { normalizeCalendarError } from '@/app/admin/calendar/_lib/errors/calendarErrors';
import { generateOccurrences } from '@/app/admin/calendar/_lib/generateEvents';
import { google } from 'googleapis';
import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { getGoogleEventDetails } from './_lib/google-calendar-meet';
import { pushRecurringRuleToGoogle } from './_lib/google-calendar-service';
import { validateCalendarEventInput } from './calendar-validators';

// ============================================================
// ============================================================
// AUTO SYNC CALENDAR INVESTMENTS (AUTOMATIC JUNCTION POPULATION)
// ============================================================
export async function syncAllCalendarInvestments() {
  const supabase = createAdminSupabaseClient();
  try {
    const { data: calendarRows, error: calErr } = await supabase
      .from('calendar')
      .select(
        `
        id,
        source_event_id,
        title,
        calendar_events:source_event_id ( opportunity_id )
      `
      );

    if (calErr || !calendarRows || calendarRows.length === 0) return { linked: 0 };

    const { data: investments, error: invErr } = await supabase
      .from('investments')
      .select(
        `
        id,
        opportunity_id,
        opportunities ( id, name )
      `
      );

    if (invErr || !investments || investments.length === 0) return { linked: 0 };

    const linksToInsert = [];

    calendarRows.forEach((cal) => {
      const rawEvent = Array.isArray(cal.calendar_events)
        ? cal.calendar_events[0]
        : cal.calendar_events;

      const oppId = cal.opportunity_id || rawEvent?.opportunity_id;
      const calTitleLower = cal.title ? cal.title.toLowerCase().trim() : '';

      investments.forEach((inv) => {
        const invOppId = inv.opportunity_id;
        const oppNameLower = inv.opportunities?.name
          ? inv.opportunities.name.toLowerCase().trim()
          : '';

        const isOppMatch =
          oppId && invOppId && String(oppId) === String(invOppId);
        const isTitleMatch =
          oppNameLower.length > 2 &&
          calTitleLower.length > 2 &&
          calTitleLower.includes(oppNameLower);

        if (isOppMatch || isTitleMatch) {
          linksToInsert.push({
            calendar_id: cal.id,
            investment_id: inv.id,
          });
        }
      });
    });

    if (linksToInsert.length > 0) {
      const { error: insertErr } = await supabase
        .from('calendar_investments')
        .upsert(linksToInsert, { onConflict: 'calendar_id,investment_id' });

      if (insertErr) {
        console.error('Error in syncAllCalendarInvestments upsert:', insertErr.message);
      }
      return { linked: linksToInsert.length };
    }

    return { linked: 0 };
  } catch (err) {
    console.error('[syncAllCalendarInvestments] Error:', err);
    return { linked: 0 };
  }
}

// ============================================================
// STITCH CALENDAR INSTANCE TO INVESTMENTS
// ============================================================
export async function attachCalendarEvent({ investmentId, event }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  // 1. Insert core calendar display instance
  const { data: calRow, error: calError } = await supabase
    .from('calendar')
    .insert({
      google_event_id: event.id,
      title: event.title,
      description: event.description,
      start_time: event.start,
      end_time: event.end,
      meet_link: event.meetLink ?? null,
    })
    .select('id')
    .single();

  if (calError) throw new Error(calError.message);

  // 2. Link relationship to target transaction inside junction map
  if (investmentId) {
    const { error: linkError } = await supabase
      .from('calendar_investments')
      .insert({
        calendar_id: calRow.id,
        investment_id: investmentId,
      });

    if (linkError) throw new Error(linkError.message);
  }

  // Auto-sync other matching investments
  await syncAllCalendarInvestments();

  revalidatePath('/admin/calendar');
  return true;
}

// ============================================================
// GOOGLE CALENDAR → SUPABASE
// ============================================================
export async function saveCalendarToSupabase(accessToken) {
  const supabase = createAdminSupabaseClient();
  const events = await getGoogleCalendarEvents(accessToken);

  let upserted = 0;

  for (const event of events) {
    const generatedKey = normalizeSessionKey(event.title) || 'general_event';

    const { error } = await supabase.from('calendar').upsert(
      {
        google_event_id: event.id,
        title: event.title || 'Untitled Event',
        description: event.description,
        start_time: event.start,
        end_time: event.end,
        meet_link: event.meetLink,
        session_key: generatedKey,
      },
      { onConflict: 'google_event_id' }
    );

    if (error) throw error;
    upserted++;
  }

  // Auto sync junction links after fetching calendar events
  await syncAllCalendarInvestments();

  return { processed: events.length, upserted };
}

// ============================================================
// ASSIGN INVESTMENTS TO CALENDAR (RPC + FALLBACK SYNC)
// ============================================================
export async function assignInvestmentsToCalendar() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data } = await supabase.rpc(
      'assign_investments_to_calendar_rpc'
    );

    // Run automated JS sync to guarantee calendar_investments updates
    const syncRes = await syncAllCalendarInvestments();

    const stats = data?.[0] ?? { linked_count: 0, unassigned_count: 0 };
    const totalLinked = Math.max(stats.linked_count || 0, syncRes.linked || 0);

    return {
      ok: true,
      linked: totalLinked,
      unassigned: stats.unassigned_count,
    };
  } catch (err) {
    console.error('[assignInvestmentsToCalendar]', err);
    const syncRes = await syncAllCalendarInvestments();
    return {
      ok: true,
      linked: syncRes.linked,
      unassigned: 0,
    };
  }
}

// ============================================================
// GET ADMIN CALENDAR SINGLE-PASS DATA FETCH
// ============================================================
export async function getAdminCalendarData() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data: calendarEvents, error } = await supabase
      .from('calendar')
      .select(
        `
        id,
        title,
        description,
        start_time,
        end_time,
        meet_link,
        session_key,
        source_event_id,
        calendar_events:source_event_id (
          status,
          opportunity_id 
        ),
        calendar_investments (
          investments:investment_id (
            id,
            opportunity_id,
            shareholders:shareholder_id ( fullName ),
            opportunities:opportunity_id ( name )
          )
        )
      `
      )
      .order('start_time');

    if (error) throw error;

    return calendarEvents.map((ev) => {
      const rawEvent = Array.isArray(ev.calendar_events)
        ? ev.calendar_events[0]
        : ev.calendar_events;

      const investmentDetails = (ev.calendar_investments || [])
        .map((link) => {
          const inv = link.investments;
          if (!inv) return null;

          const sh = Array.isArray(inv.shareholders)
            ? inv.shareholders[0]
            : inv.shareholders;
          const opp = Array.isArray(inv.opportunities)
            ? inv.opportunities[0]
            : inv.opportunities;

          return {
            id: inv.id,
            opportunityId: inv.opportunity_id,
            shareholderName: String(
              sh?.fullName ?? 'UNKNOWN SHAREHOLDER'
            ).toUpperCase(),
            opportunityName: String(
              opp?.name ?? 'UNKNOWN OPPORTUNITY'
            ).toUpperCase(),
          };
        })
        .filter(Boolean);

      return {
        id: ev.id,
        title: ev.title ? String(ev.title).toUpperCase() : 'UNTITLED MEETING',
        description: ev.description,
        start_time: ev.start_time,
        end_time: ev.end_time,
        meet_link: ev.meet_link,
        session_key: ev.session_key,
        source_event_id: ev.source_event_id,
        opportunity_id: rawEvent?.opportunity_id ?? null,
        status: rawEvent?.status
          ? String(rawEvent.status).toLowerCase()
          : 'scheduled',
        investmentDetails,
      };
    });
  } catch (err) {
    console.error(
      '[getAdminCalendarData] Error processing schedules:',
      err.message
    );
    throw new Error(
      `${err.message || 'Failed to aggregate calendar information.'}`
    );
  }
}

// ============================================================
// RECURRING BLUEPRINT ENGINE & GOOGLE SYNC (FIXED TIME MATCH)
// ============================================================
export async function syncRecurringRulesToGoogle() {
  noStore();
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();
  const calendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID;

  if (!calendar) return { ok: true, skipped: true };

  const { data: rules, error } = await supabase
    .from('opportunity_availability_rules')
    .select('*, opportunities(name)')
    .is('google_master_event_id', null)
    .eq('is_active', true);

  if (error) {
    console.error('[syncRecurringRulesToGoogle] Fetch Error:', error.message);
    return { ok: false, error };
  }

  if (!rules?.length) return { ok: true, synced: 0 };

  let syncedCount = 0;

  for (const rule of rules) {
    try {
      const cleanStartTime = String(rule.start_time).split('.')[0];
      const cleanEndTime = String(rule.end_time).split('.')[0];

      const startDT = `${rule.starts_on}T${cleanStartTime}`;
      const endDT = `${rule.starts_on}T${cleanEndTime}`;

      const googleData = await pushRecurringRuleToGoogle({
        title: rule.opportunities?.name || 'WINAM Investment Opportunity',
        startDateTime: startDT,
        endDateTime: endDT,
        timezone: rule.timezone,
        weekday: rule.weekday,
        repeatEveryWeeks: rule.repeat_every_weeks,
        endsOn: rule.ends_on,
      });

      if (!googleData?.master_id) {
        throw new Error(
          `Google API did not return a valid master_id for rule reference: ${rule.id}`
        );
      }

      await supabase
        .from('opportunity_availability_rules')
        .update({ google_master_event_id: googleData.master_id })
        .eq('id', rule.id);

      const { data: instancesData } = await calendar.events.instances({
        calendarId,
        eventId: googleData.master_id,
      });

      const instances = instancesData?.items || [];

      for (const instance of instances) {
        const startISO = instance.start?.dateTime || instance.start?.date;
        if (!startISO) continue;

        // 🔍 Establish window boundaries around instance time to swallow DB formatting mismatches
        const instanceDate = new Date(startISO);
        const windowStart = new Date(
          instanceDate.getTime() - 30000
        ).toISOString();
        const windowEnd = new Date(
          instanceDate.getTime() + 30000
        ).toISOString();

        // Update Target A: master_calendar using safe time window parameters
        const { data: masterUpdated, error: masterErr } = await supabase
          .from('master_calendar')
          .update({
            google_event_id: instance.id,
            google_calendar_id: calendarId,
            status: 'active',
          })
          .eq('opportunity_id', rule.opportunity_id)
          .gte('start_at', windowStart)
          .lte('start_at', windowEnd)
          .select();

        if (masterErr) {
          console.error(
            `[Sync] master_calendar Update Error for instance ${instance.id}:`,
            masterErr.message
          );
        }

        // Update Target B: calendar_events using matching time window parameters
        const { data: updatedEventRows, error: eventErr } = await supabase
          .from('calendar_events')
          .update({
            google_event_id: instance.id,
            google_calendar_id: calendarId,
            status: 'exported',
            exported_at: new Date().toISOString(),
          })
          .eq('availability_rule_id', rule.id)
          .gte('start_at', windowStart)
          .lte('start_at', windowEnd)
          .select();

        if (eventErr) {
          console.error(
            `[Sync] calendar_events Update Error for instance ${instance.id}:`,
            eventErr.message
          );
        }

        // Update Target C: UI Presentation Layer (calendar)
        if (updatedEventRows && updatedEventRows.length > 0) {
          const calendarRows = updatedEventRows.map((ev) => ({
            source_event_id: ev.id,
            google_event_id: String(instance.id),
            start_time: ev.start_at,
            end_time: ev.end_at,
            meet_link: instance.hangoutLink || null,
          }));

          const { error: upsertError } = await supabase
            .from('calendar')
            .upsert(calendarRows, {
              onConflict: 'source_event_id',
            });

          if (upsertError) {
            console.error(
              `[syncRecurringRulesToGoogle] Display Calendar Upsert Failure:`,
              upsertError.message
            );
          }
        } else if (!eventErr) {
          console.warn(
            `[Sync] No matching calendar_events rows caught between ${windowStart} and ${windowEnd} for rule ${rule.id}`
          );
        }
      }

      syncedCount++;
    } catch (err) {
      console.error(
        `❌ Sync processing chain failed for rule ID ${rule.id}:`,
        err.message || err
      );
    }
  }

  revalidatePath('/admin/calendar');
  return { ok: true, synced: syncedCount };
}

// ============================================================
// GET ADMIN INVESTMENTS FOR SPECIFIC DATE (FIXED SNAKE_CASE)
// ============================================================
export async function getAdminInvestmentsForDate(date) {
  if (!date) return [];

  const supabase = createAdminSupabaseClient();
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data: calendarEvents, error: evErr } = await supabase
    .from('calendar')
    .select('*')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time');

  if (evErr) throw new Error(evErr.message);
  if (!calendarEvents.length) return [];

  const calendarIds = calendarEvents.map((e) => e.id);

  const { data: calendarLinks, error: linkErr } = await supabase
    .from('calendar_investments')
    .select(
      `
      calendar_id,
      investment_id,
      investments:investment_id (
        id,
        shareholders:shareholder_id ( fullName )
      )
    `
    )
    .in('calendar_id', calendarIds);

  if (linkErr) throw new Error(linkErr.message);

  return calendarEvents.map((ev) => {
    const shareholders = calendarLinks
      .filter((link) => link.calendar_id === ev.id)
      .map((link) => ({
        id: link.investments?.id,
        shareholderName:
          link.investments?.shareholders?.fullName ?? 'Unknown Shareholder',
      }));

    return {
      id: ev.id,
      session_key: ev.session_key,
      title: ev.title,
      start_time: ev.start_time,
      end_time: ev.end_time,
      meet_link: ev.meet_link,
      investments: shareholders,
    };
  });
}

// ============================================================
// GET FULL VIEW OF CALENDAR (OPPORTUNITY BRIEFING MODEL)
// ============================================================
export async function getFullViewData() {
  const supabase = createAdminSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('calendar_events')
    .select(`
      id,
      start_at,
      end_at, 
      opportunity_id,
      opportunities (
        name,
        investments (
          id,
          shareholders ( "fullName" )
        )
      )
    `)
    .gte('start_at', today.toISOString())
    .order('start_at');

  if (error) {
    console.error('SUPABASE QUERY ERROR IN getFullViewData:', error);
    throw new Error(error.message);
  }

  const formattedData = data.map((event) => {
    const rawInvestments = event.opportunities?.investments || [];
    
    return {
      calendar_id: event.id,
      start_time: event.start_at, 
      end_time: event.end_at, /* <-- 2. ADD THIS MAPPING */
      investments: rawInvestments.map(inv => ({
        investment_id: inv.id,
        opportunity_id: event.opportunity_id,
        opportunity_name: event.opportunities?.name ?? 'Unknown',
        shareholder_name: inv.shareholders?.fullName ?? 'Unknown',
      }))
    };
  });

  return formattedData;
}

// ============================================================
// CREATE AVAILABILITY ENGINE RULES
// ============================================================
export async function createAvailabilityRuleAndEvents(payload) {
  const supabase = createAdminSupabaseClient();

  try {
    const occurrences = generateOccurrences({
      weekday: payload.weekday,
      startTime: payload.startTime,
      endTime: payload.endTime,
      repeatEveryWeeks: payload.repeatEveryWeeks,
      startsOn: payload.startsOn,
      endsOn: payload.endsOn,
      timezone: payload.timezone,
    });

    if (!occurrences.length) {
      throw new Error(
        'No prospective calendar slots could be generated with the provided parameters.'
      );
    }

    // Single atomic call to Postgres
    const { data: result, error: rpcError } = await supabase.rpc(
      'create_availability_flow',
      {
        p_opportunity_id: payload.opportunityId,
        p_timezone: payload.timezone,
        p_weekday: payload.weekday,
        p_start_time: payload.startTime,
        p_end_time: payload.endTime,
        p_repeat_every_weeks: payload.repeatEveryWeeks,
        p_starts_on: payload.startsOn,
        p_ends_on: payload.endsOn,
        p_created_by: payload.createdBy,
        p_occurrences: occurrences,
      }
    );

    if (rpcError) throw rpcError;

    // Google Sync runs only if DB transaction succeeds
    const syncResult = await syncRecurringRulesToGoogle();
    if (!syncResult.ok) throw syncResult.error;

    revalidatePath('/admin/calendar');

    return { ok: true, generated: result.generated };
  } catch (err) {
    console.error('[createAvailabilityRuleAndEvents] Critical Failure:', err);
    return { ok: false, error: normalizeCalendarError(err) };
  }
}

// ============================================================
// CREATE AVAILABILITY ENGINE RULES
// ============================================================
export async function createAvailabilityRuleAndEvents_old(payload) {
  const supabase = createAdminSupabaseClient();

  try {
    const occurrences = generateOccurrences({
      weekday: payload.weekday,
      startTime: payload.startTime,
      endTime: payload.endTime,
      repeatEveryWeeks: payload.repeatEveryWeeks,
      startsOn: payload.startsOn,
      endsOn: payload.endsOn,
      timezone: payload.timezone,
    });

    if (!occurrences.length) {
      throw new Error(
        'No prospective calendar slots could be generated with the provided parameters.'
      );
    }

    const { data: existingSlots, error: checkError } = await supabase
      .from('master_calendar')
      .select('start_at')
      .eq('opportunity_id', payload.opportunityId)
      .eq('status', 'active')
      .in(
        'start_at',
        occurrences.map((o) => o.start_at)
      );

    if (checkError) throw checkError;

    if (existingSlots && existingSlots.length > 0) {
      throw new Error(
        `Conflict: This opportunity is already active for ${existingSlots.length} of the selected dates.`
      );
    }

    const { data: rule, error: ruleError } = await supabase
      .from('opportunity_availability_rules')
      .insert({
        opportunity_id: payload.opportunityId,
        timezone: payload.timezone,
        weekday: payload.weekday,
        start_time: payload.startTime,
        end_time: payload.endTime,
        repeat_every_weeks: payload.repeatEveryWeeks,
        starts_on: payload.startsOn,
        ends_on: payload.endsOn,
        created_by: payload.createdBy,
        is_active: true,
      })
      .select()
      .single();

    if (ruleError) throw ruleError;

    const eventRows = occurrences.map((o) => ({
      availability_rule_id: rule.id,
      opportunity_id: rule.opportunity_id,
      start_at: o.start_at,
      end_at: o.end_at,
      timezone: o.timezone,
      status: 'published',
    }));

    const masterRows = occurrences.map((o) => ({
      opportunity_id: rule.opportunity_id,
      start_at: o.start_at,
      end_at: o.end_at,
      timezone: rule.timezone,
      status: 'active',
    }));

    const { data: createdEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .insert(eventRows)
      .select('id, start_at, end_at');

    if (eventsError) throw eventsError;

    const { error: masterError } = await supabase
      .from('master_calendar')
      .upsert(masterRows, { onConflict: 'opportunity_id,start_at' });

    if (masterError) throw masterError;

    if (createdEvents && createdEvents.length > 0) {
      const calendarRows = createdEvents.map((evt) => ({
        start_time: evt.start_at,
        end_time: evt.end_at,
        source_event_id: evt.id,
        title: payload.opportunityName || 'Investment Opportunity',
        description: payload.description || 'Investment Opportunity Conference',
      }));

      const { error: coreCalendarError } = await supabase
        .from('calendar')
        .insert(calendarRows);

      if (coreCalendarError) throw coreCalendarError;

      // Auto-sync new calendar entries to shareholder investments
      await syncAllCalendarInvestments();
    }

    const syncResult = await syncRecurringRulesToGoogle();
    if (!syncResult.ok) throw syncResult.error;

    revalidatePath('/admin/calendar');

    return { ok: true, generated: eventRows.length };
  } catch (err) {
    console.error('[createAvailabilityRuleAndEvents] Critical Failure:', err);
    return { ok: false, error: normalizeCalendarError(err) };
  }
}

// ============================================================
// CANCEL SYSTEM EVENTS
// ============================================================
export async function cancelCalendarEvent_old(eventId) {
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();

  try {
    const { data: event } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) return { ok: true };

    if (event.google_event_id) {
      await calendar.events
        .delete({
          calendarId: event.google_calendar_id || 'primary',
          eventId: event.google_event_id,
        })
        .catch(() => console.warn('Google event already missing.'));
    }

    await supabase
      .from('master_calendar')
      .update({ status: 'cancelled', deleted_at: new Date().toISOString() })
      .eq('opportunity_id', event.opportunity_id)
      .eq('start_at', event.start_at);

    await supabase.from('calendar_events').delete().eq('id', eventId);

    revalidatePath('/admin/calendar');
    return { ok: true };
  } catch (err) {
    console.error('Cancellation Error:', err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// CANCEL SYSTEM EVENTS
// ============================================================
export async function cancelCalendarEvent(eventId) {
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();

  try {
    // 1. Fetch the event so we have the Google IDs
    const { data: event } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) return { ok: true };

    // 2. Talk to the Outside World (Google)
    if (event.google_event_id) {
      await calendar.events
        .delete({
          calendarId: event.google_calendar_id || 'primary',
          eventId: event.google_event_id,
        })
        .catch(() => console.warn('Google event already missing.'));
    }

    // 3. Initiate Database Deletion
    // (This automatically fires your Trigger and Cascade rules!)
    await supabase.from('calendar_events').delete().eq('id', eventId);

    revalidatePath('/admin/calendar');
    return { ok: true };
  } catch (err) {
    console.error('Cancellation Error:', err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// RECONCILE GOOGLE CANCELLATIONS
// ============================================================
export async function reconcileGoogleCancellations() {
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();
  const targetCalendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID || 'primary';

  try {
    const now = new Date().toISOString();

    const { data: localEvents, error: fetchError } = await supabase
      .from('calendar_events')
      .select('id, opportunity_id, start_at, google_event_id')
      .eq('status', 'exported')
      .not('google_event_id', 'is', null)
      .gte('start_at', now);

    if (fetchError || !localEvents?.length)
      return { ok: true, cancelledLocally: 0 };

    let removedCount = 0;

    for (const event of localEvents) {
      try {
        const response = await calendar.events.get({
          calendarId: targetCalendarId,
          eventId: event.google_event_id,
        });

        if (response.data.status === 'cancelled') throw { code: 404 };
      } catch (err) {
        if (err.code === 404 || err.code === 410) {
          await supabase
            .from('master_calendar')
            .update({
              status: 'external_deletion',
              deleted_at: new Date().toISOString(),
            })
            .eq('opportunity_id', event.opportunity_id)
            .eq('start_at', event.start_at);

          await supabase.from('calendar_events').delete().eq('id', event.id);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) revalidatePath('/admin/calendar');

    return { ok: true, cancelledLocally: removedCount };
  } catch (err) {
    console.error('Reconciliation Error:', err);
    return { ok: false, error: err.message };
  }
}

// ============================================================
// ADDITIONAL BOILERPLATE UTILITIES & HELPERS
// ============================================================
export async function getAdminOpportunities() {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, name')
    .eq('status', 'active')
    .order('name');

  if (error) throw new Error('Failed to load opportunities');
  return (data || []).map((o) => ({
    id: o.id,
    name: String(o.name || 'UNTITLED OPPORTUNITY').toUpperCase(),
  }));
}

export async function publishCalendarEvents() {
  const supabase = createAdminSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ status: 'published' })
      .eq('status', 'scheduled')
      .select('id');

    if (error) throw error;

    return { ok: true, published: data?.length ?? 0 };
  } catch (err) {
    return { ok: false, error: normalizeCalendarError(err) };
  }
}

export async function unpublishCalendarEvent(eventId) {
  const supabase = createAdminSupabaseClient();
  try {
    // 1. Change the status away from published/exported
    const { error: updateError } = await supabase
      .from('calendar_events')
      .update({ status: 'scheduled' })
      .eq('id', eventId);

    if (updateError) throw updateError;

    // 2. Replicate the trigger's behavior: Delete from the public calendar
    // Note: Assuming 'calendar' is in the default 'public' schema
    const { error: deleteError } = await supabase
      .from('calendar')
      .delete()
      .eq('source_event_id', eventId);

    if (deleteError) throw deleteError;

    return { ok: true };
  } catch (err) {
    return { ok: false, error: normalizeCalendarError(err) };
  }
}

export async function syncMissingMeetingLinks() {
  const supabase = createAdminSupabaseClient();
  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('id, google_event_id')
      .not('google_event_id', 'is', null)
      .is('google_meet_link', null);

    if (error) throw error;
    if (!events?.length) return { ok: true, synced: 0 };

    let updateCount = 0;
    for (const event of events) {
      const googleData = await getGoogleEventDetails(event.google_event_id);
      if (googleData.meetLink) {
        await supabase
          .from('calendar_events')
          .update({ google_meet_link: googleData.meetLink })
          .eq('id', event.id);
        await supabase
          .from('calendar')
          .update({ meet_link: googleData.meetLink })
          .eq('source_event_id', event.id);
        updateCount++;
      }
    }
    return { ok: true, synced: updateCount };
  } catch (err) {
    return { ok: false, error: normalizeCalendarError(err) };
  }
}

async function getCalendar() {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!jsonString) return null;

  try {
    const credentials = JSON.parse(jsonString);
    const authObj = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    return google.calendar({ version: 'v3', auth: await authObj.getClient() });
  } catch (error) {
    throw new Error(
      'Calendar authentication credentials corrupt or badly formatted.'
    );
  }
}

function normalizeSessionKey(title) {
  if (!title) return null;
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function createCalendarEvent(formData) {
  const input = {
    title: formData.get('title'),
    session_key: formData.get('session_key'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  };
  validateCalendarEventInput(input);
}

export async function createOrUpdateCalendarEvent(input) {
  validateCalendarEventInput(input);
  const supabase = createAdminSupabaseClient();
  const { error } = await supabase.from('calendar').upsert(
    {
      title: input.title,
      session_key: input.session_key,
      start_time: input.start_time,
      end_time: input.end_time,
      meet_link: input.meet_link,
    },
    { onConflict: 'session_key,start_time,end_time' }
  );
  if (error) throw error;
}

export async function getInvestorsForOpportunity(opportunityId) {
   // Guard clause to catch undefined IDs before querying
  if (!opportunityId) {
    console.error('ERROR: opportunityId is undefined or null.');
    return [];
  }

  const supabase = createAdminSupabaseClient();

  // Joins the investments table with the shareholders table
  const { data, error } = await supabase
    .from('investments')
    .select(
      `
      id,
      amount_invested,
      total_committed,
      status,
      start_date,
      shareholders (
        id,
        "fullName",
        email,
        telephone,
        nationality,
        "shareholderStatus"
      )
    `
    )
    .eq('opportunity_id', opportunityId);

  if (error) {
    console.error('Supabase Query Error:', error);
    throw new Error('Failed to fetch investors for this opportunity.');
  }

  
  if (data?.length > 0) {
  
  }

  return data;
}