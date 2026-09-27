-- ============================================================
-- SQL SCRIPT: SYNC / BACKFILL MISSING LEGACY INVESTMENTS
-- Run this in your Supabase SQL Editor to ensure all legacy
-- shareholders' allocations & payments are recorded in investments.
-- ============================================================

-- 1. Ensure 'investments' column exists on legacy_shareholders table
ALTER TABLE public.legacy_shareholders 
  ADD COLUMN IF NOT EXISTS investments JSONB DEFAULT '[]'::jsonb;

-- 2. Insert missing investment records into public.investments
-- This pulls all legacy payments (type = 'legacy_investment' or stripe_payment_intent_id LIKE 'legacy_%')
-- that are succeeded and do not yet have a matching row in public.investments.
INSERT INTO public.investments (
  shareholder_id,
  opportunity_id,
  amount_invested,
  total_committed,
  status,
  start_date,
  notes,
  created_at,
  updated_at
)
SELECT 
  p.shareholder_id,
  p.opportunity_id,
  SUM(p.amount) AS amount_invested,
  SUM(p.amount) AS total_committed,
  'active' AS status,
  COALESCE(MIN(p.created_at)::date, CURRENT_DATE) AS start_date,
  'Transitioned from legacy records' AS notes,
  COALESCE(MIN(p.created_at), NOW()) AS created_at,
  NOW() AS updated_at
FROM public.payments p
WHERE (p.type = 'legacy_investment' OR p.stripe_payment_intent_id LIKE 'legacy_%')
  AND p.status = 'succeeded'
  AND p.shareholder_id IS NOT NULL
  AND p.opportunity_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM public.investments inv 
    WHERE inv.shareholder_id = p.shareholder_id 
      AND inv.opportunity_id = p.opportunity_id
  )
GROUP BY p.shareholder_id, p.opportunity_id;

-- 3. Synchronize calendar_investments for any newly created investments
-- (Matches investments to calendar events by opportunity_id or event relation)
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

-- 4. Verification Query: View all investments created for legacy shareholders
SELECT 
  inv.id AS investment_id,
  sh.id AS shareholder_id,
  sh."fullName" AS shareholder_name,
  sh.email,
  opp.id AS opportunity_id,
  opp.name AS opportunity_name,
  inv.amount_invested,
  inv.status,
  inv.start_date,
  inv.created_at
FROM public.investments inv
JOIN public.shareholders sh ON inv.shareholder_id = sh.id
LEFT JOIN public.opportunities opp ON inv.opportunity_id = opp.id
ORDER BY inv.created_at DESC;
