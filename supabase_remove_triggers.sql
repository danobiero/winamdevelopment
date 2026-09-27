-- ============================================================
-- REMOVE CALENDAR_INVESTMENTS TRIGGERS & FUNCTIONS
-- Run this in your Supabase SQL Editor to remove all triggers.
-- ============================================================

-- 1. DROP TRIGGERS
DROP TRIGGER IF EXISTS trg_sync_calendar_investments_on_calendar ON public.calendar;
DROP TRIGGER IF EXISTS trg_sync_calendar_investments_on_calendar_events ON public.calendar_events;
DROP TRIGGER IF EXISTS trg_sync_calendar_investments_on_new_investment ON public.investments;

-- 2. DROP TRIGGER FUNCTIONS
DROP FUNCTION IF EXISTS public.fn_trg_sync_calendar_investments_from_calendar();
DROP FUNCTION IF EXISTS public.fn_trg_sync_calendar_investments_from_calendar_events();
DROP FUNCTION IF EXISTS public.fn_trg_sync_calendar_investments_on_new_investment();
DROP FUNCTION IF EXISTS public.fn_sync_calendar_investments_from_calendar();
DROP FUNCTION IF EXISTS public.fn_sync_calendar_investments_from_calendar_events();
DROP FUNCTION IF EXISTS public.fn_sync_calendar_investments_on_new_investment();
