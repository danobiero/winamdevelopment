-- ============================================================
-- BULLETPROOF AUTOMATIC CALENDAR_INVESTMENTS TRIGGERS & BACKFILL
-- Run this script in your Supabase SQL Editor.
-- ============================================================

-- 1. Ensure unique constraint exists if possible (safe execution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendar_investments_cal_inv_unique'
  ) THEN
    ALTER TABLE public.calendar_investments 
    ADD CONSTRAINT calendar_investments_cal_inv_unique UNIQUE (calendar_id, investment_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;


-- 2. FUNCTION & TRIGGER FOR public.calendar
CREATE OR REPLACE FUNCTION public.fn_trg_sync_calendar_investments_from_calendar()
RETURNS TRIGGER AS $$
DECLARE
  v_opp_id UUID;
BEGIN
  -- Resolve opportunity_id directly or via source_event_id relation
  v_opp_id := NEW.opportunity_id;

  IF v_opp_id IS NULL AND NEW.source_event_id IS NOT NULL THEN
    SELECT opportunity_id INTO v_opp_id
    FROM public.calendar_events
    WHERE id = NEW.source_event_id;
  END IF;

  -- A. Link investments by opportunity_id
  IF v_opp_id IS NOT NULL THEN
    INSERT INTO public.calendar_investments (calendar_id, investment_id)
    SELECT NEW.id, inv.id
    FROM public.investments inv
    WHERE inv.opportunity_id = v_opp_id
      AND NOT EXISTS (
        SELECT 1 FROM public.calendar_investments ci 
        WHERE ci.calendar_id = NEW.id AND ci.investment_id = inv.id
      );
  END IF;

  -- B. Link investments by title matching (e.g. "Core Portfolio")
  IF NEW.title IS NOT NULL AND LENGTH(NEW.title) > 2 THEN
    INSERT INTO public.calendar_investments (calendar_id, investment_id)
    SELECT NEW.id, inv.id
    FROM public.investments inv
    JOIN public.opportunities opp ON inv.opportunity_id = opp.id
    WHERE LOWER(NEW.title) LIKE '%' || LOWER(opp.name) || '%'
      AND NOT EXISTS (
        SELECT 1 FROM public.calendar_investments ci 
        WHERE ci.calendar_id = NEW.id AND ci.investment_id = inv.id
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_calendar_investments_on_calendar ON public.calendar;

CREATE TRIGGER trg_sync_calendar_investments_on_calendar
AFTER INSERT OR UPDATE ON public.calendar
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_sync_calendar_investments_from_calendar();


-- 3. FUNCTION & TRIGGER FOR public.calendar_events
CREATE OR REPLACE FUNCTION public.fn_trg_sync_calendar_investments_from_calendar_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.opportunity_id IS NOT NULL THEN
    INSERT INTO public.calendar_investments (calendar_id, investment_id)
    SELECT cal.id, inv.id
    FROM public.calendar cal
    CROSS JOIN public.investments inv
    WHERE inv.opportunity_id = NEW.opportunity_id
      AND (cal.source_event_id = NEW.id OR cal.opportunity_id = NEW.opportunity_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.calendar_investments ci 
        WHERE ci.calendar_id = cal.id AND ci.investment_id = inv.id
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_calendar_investments_on_calendar_events ON public.calendar_events;

CREATE TRIGGER trg_sync_calendar_investments_on_calendar_events
AFTER INSERT OR UPDATE ON public.calendar_events
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_sync_calendar_investments_from_calendar_events();


-- 4. FUNCTION & TRIGGER FOR public.investments
CREATE OR REPLACE FUNCTION public.fn_trg_sync_calendar_investments_on_new_investment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.opportunity_id IS NOT NULL THEN
    INSERT INTO public.calendar_investments (calendar_id, investment_id)
    SELECT cal.id, NEW.id
    FROM public.calendar cal
    LEFT JOIN public.calendar_events ce ON cal.source_event_id = ce.id
    LEFT JOIN public.opportunities opp ON NEW.opportunity_id = opp.id
    WHERE cal.opportunity_id = NEW.opportunity_id
       OR ce.opportunity_id = NEW.opportunity_id
       OR (cal.title IS NOT NULL AND opp.name IS NOT NULL AND LOWER(cal.title) LIKE '%' || LOWER(opp.name) || '%')
      AND NOT EXISTS (
        SELECT 1 FROM public.calendar_investments ci 
        WHERE ci.calendar_id = cal.id AND ci.investment_id = NEW.id
      );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_calendar_investments_on_new_investment ON public.investments;

CREATE TRIGGER trg_sync_calendar_investments_on_new_investment
AFTER INSERT OR UPDATE ON public.investments
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_sync_calendar_investments_on_new_investment();


-- 5. IMMEDIATE BACKFILL PASS 1 (Opportunity ID match)
INSERT INTO public.calendar_investments (calendar_id, investment_id)
SELECT DISTINCT cal.id, inv.id
FROM public.calendar cal
LEFT JOIN public.calendar_events ce ON cal.source_event_id = ce.id
JOIN public.investments inv ON inv.opportunity_id = COALESCE(cal.opportunity_id, ce.opportunity_id)
WHERE COALESCE(cal.opportunity_id, ce.opportunity_id) IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.calendar_investments ci 
    WHERE ci.calendar_id = cal.id AND ci.investment_id = inv.id
  );

-- 6. IMMEDIATE BACKFILL PASS 2 (Title matching fallback)
INSERT INTO public.calendar_investments (calendar_id, investment_id)
SELECT DISTINCT cal.id, inv.id
FROM public.calendar cal
JOIN public.investments inv ON inv.opportunity_id IS NOT NULL
JOIN public.opportunities opp ON inv.opportunity_id = opp.id
WHERE cal.title IS NOT NULL 
  AND LOWER(cal.title) LIKE '%' || LOWER(opp.name) || '%'
  AND NOT EXISTS (
    SELECT 1 FROM public.calendar_investments ci 
    WHERE ci.calendar_id = cal.id AND ci.investment_id = inv.id
  );
