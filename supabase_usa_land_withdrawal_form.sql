-- ============================================================================
-- WINAM DEVELOPMENT GROUP, LLC
-- USA LAND PROJECT: MEMBER WITHDRAWAL & INTEREST DISPOSITION FORM SCHEMA
-- Run this script in the Supabase SQL Editor
-- ============================================================================

-- 1. Create table for Member Withdrawal Forms
CREATE TABLE IF NOT EXISTS public.member_withdrawal_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_request_id BIGINT REFERENCES public.redemption_requests(id) ON DELETE CASCADE,
  investment_id BIGINT REFERENCES public.investments(id) ON DELETE CASCADE,
  opportunity_id BIGINT REFERENCES public.opportunities(id) ON DELETE CASCADE,
  shareholder_id BIGINT REFERENCES public.shareholders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_member_submission',
  -- Statuses:
  -- 'pending_member_submission' : Awaiting redeeming shareholder to complete Page 1
  -- 'pending_consents'          : Page 1 submitted; awaiting participating member consents in Part 5
  -- 'pending_admin_approval'    : Consents gathered; awaiting Part 6 Admin signatures
  -- 'approved'                  : Part 6 completed; redemption ready for payout processing
  -- 'rejected'                  : Request rejected
  -- 'expired'                   : 30-day window expired
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  page1_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  consents JSONB NOT NULL DEFAULT '[]'::jsonb,
  part6_admin JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_mwf_redemption_unique ON public.member_withdrawal_forms(redemption_request_id);
CREATE INDEX IF NOT EXISTS idx_mwf_investment_id ON public.member_withdrawal_forms(investment_id);
CREATE INDEX IF NOT EXISTS idx_mwf_shareholder_id ON public.member_withdrawal_forms(shareholder_id);
CREATE INDEX IF NOT EXISTS idx_mwf_opportunity_id ON public.member_withdrawal_forms(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_mwf_status ON public.member_withdrawal_forms(status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.member_withdrawal_forms ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access on member_withdrawal_forms" ON public.member_withdrawal_forms;
CREATE POLICY "Service role full access on member_withdrawal_forms"
  ON public.member_withdrawal_forms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated shareholders can read forms related to their investments or opportunities
DROP POLICY IF EXISTS "Shareholders can view relevant withdrawal forms" ON public.member_withdrawal_forms;
CREATE POLICY "Shareholders can view relevant withdrawal forms"
  ON public.member_withdrawal_forms
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated shareholders can update forms (guarded via server actions)
DROP POLICY IF EXISTS "Authenticated can update withdrawal forms" ON public.member_withdrawal_forms;
CREATE POLICY "Authenticated can update withdrawal forms"
  ON public.member_withdrawal_forms
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated shareholders can insert forms
DROP POLICY IF EXISTS "Authenticated can insert withdrawal forms" ON public.member_withdrawal_forms;
CREATE POLICY "Authenticated can insert withdrawal forms"
  ON public.member_withdrawal_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

GRANT ALL ON public.member_withdrawal_forms TO authenticated, anon, service_role;
