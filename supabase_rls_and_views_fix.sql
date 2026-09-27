-- ============================================================================
-- SUPABASE RLS & DATABASE VIEW SECURITY FIX
-- Run this in the Supabase SQL Editor to resolve RLS permission issues
-- and secure 'user_ledger_view' without breaking admin or finance reports.
-- ============================================================================

-- 1. Ensure service_role has full bypass and permissions on all tables
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 2. OPPORTUNITIES TABLE
-- Opportunities are public investment choices displayed on the platform.
-- RLS must allow SELECT for anon and authenticated users.
ALTER TABLE IF EXISTS public.opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated can view opportunities" ON public.opportunities;
CREATE POLICY "Public and authenticated can view opportunities"
  ON public.opportunities
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access on opportunities" ON public.opportunities;
CREATE POLICY "Service role full access on opportunities"
  ON public.opportunities
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. OPPORTUNITY DOCUMENTS TABLE
-- Document reports, brochures, and quarterly statements
ALTER TABLE IF EXISTS public.opportunity_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated can view opportunity documents" ON public.opportunity_documents;
CREATE POLICY "Public and authenticated can view opportunity documents"
  ON public.opportunity_documents
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access on opportunity documents" ON public.opportunity_documents;
CREATE POLICY "Service role full access on opportunity documents"
  ON public.opportunity_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. OPPORTUNITY VALUATIONS TABLE
ALTER TABLE IF EXISTS public.opportunity_valuations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public and authenticated can view valuations" ON public.opportunity_valuations;
CREATE POLICY "Public and authenticated can view valuations"
  ON public.opportunity_valuations
  FOR SELECT
  TO public, anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role full access on valuations" ON public.opportunity_valuations;
CREATE POLICY "Service role full access on opportunity_valuations"
  ON public.opportunity_valuations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. OPERATING EXPENSES TABLE
ALTER TABLE IF EXISTS public.operating_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on operating_expenses" ON public.operating_expenses;
CREATE POLICY "Service role full access on operating_expenses"
  ON public.operating_expenses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. LEGACY SHAREHOLDERS TABLE
ALTER TABLE IF EXISTS public.legacy_shareholders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on legacy_shareholders" ON public.legacy_shareholders;
CREATE POLICY "Service role full access on legacy_shareholders"
  ON public.legacy_shareholders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. SHAREHOLDERS TABLE
ALTER TABLE IF EXISTS public.shareholders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shareholders can view own profile" ON public.shareholders;
CREATE POLICY "Shareholders can view own profile"
  ON public.shareholders
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Service role full access on shareholders" ON public.shareholders;
CREATE POLICY "Service role full access on shareholders"
  ON public.shareholders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 8. PAYMENTS TABLE
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shareholders can view own payments" ON public.payments;
CREATE POLICY "Shareholders can view own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    shareholder_id IN (
      SELECT id FROM public.shareholders WHERE email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Service role full access on payments" ON public.payments;
CREATE POLICY "Service role full access on payments"
  ON public.payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. INVESTMENTS TABLE
ALTER TABLE IF EXISTS public.investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shareholders can view own investments" ON public.investments;
CREATE POLICY "Shareholders can view own investments"
  ON public.investments
  FOR SELECT
  TO authenticated
  USING (
    shareholder_id IN (
      SELECT id FROM public.shareholders WHERE email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS "Service role full access on investments" ON public.investments;
CREATE POLICY "Service role full access on investments"
  ON public.investments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. USER_LEDGER_VIEW
-- If you secured the view using: ALTER VIEW user_ledger_view SET (security_invoker = on);
-- The view will execute queries with the caller's privileges.
-- The RLS policies above for 'payments', 'shareholders', 'opportunities', and 'investments'
-- permit shareholders to view their ledger transactions without 42501 permission errors.
-- Alternatively, if you want the view to always have access to its underlying tables
-- regardless of caller RLS, you can run:
-- ALTER VIEW public.user_ledger_view SET (security_invoker = off);

GRANT SELECT ON public.user_ledger_view TO anon, authenticated, service_role;
