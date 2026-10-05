-- ============================================================================
-- SUPABASE DATABASE FIX: user_ledger_view FOR NON-STRIPE REDEMPTIONS
-- ============================================================================
-- Description:
-- Fixes missing 'shareholder_id', 'shareholder_name', and 'shareholder_email'
-- in 'user_ledger_view' for non-Stripe originated redemptions (such as Zelle,
-- CashApp, Wire, Check, and manual payouts).
--
-- Why the issue occurred:
-- The previous view definition joined 'redemptions' strictly to 'payments'
-- using Stripe transaction identifiers (stripe_payment_intent_id or stripe_charge_id).
-- Non-Stripe and manual redemptions lack Stripe transaction IDs, causing the
-- join to fail and resulting in NULL shareholder details.
--
-- How to apply:
-- Run this script in the Supabase SQL Editor.
-- ============================================================================

-- 1. RECREATE VIEW: user_ledger_view
CREATE OR REPLACE VIEW public.user_ledger_view AS

-- PART A: INFLOWS / PAYMENTS (Investments, Legacy Investments, Fees)
SELECT 
    p.id AS transaction_id,
    p.created_at AS transaction_date,
    p.stripe_charge_id,
    p.receipt_url,
    p.shareholder_id,
    s."fullName" AS shareholder_name,
    s.email AS shareholder_email,
    p.amount,
    p.currency,
    p.status AS payment_status,
    COALESCE(p.type, p.payment_method_type, 'manual') AS payment_method_type,
    p.opportunity_id,
    o.name AS opportunity_name,
    o.type AS opportunity_type,
    p.fee_id,
    f.name AS fee_name,
    f.type AS fee_type,
    CASE 
        WHEN p.fee_id IS NOT NULL THEN 'Fee'
        ELSE 'Opportunity Investment'
    END AS ledger_category,
    COALESCE(o.name, f.name, 'Investment') AS line_item_name,
    p.description AS memo
FROM public.payments p
LEFT JOIN public.shareholders s ON s.id = p.shareholder_id
LEFT JOIN public.opportunities o ON o.id = p.opportunity_id
LEFT JOIN public.fees f ON f.id = p.fee_id

UNION ALL

-- PART B: OUTFLOWS / REDEMPTIONS (Stripe refunds & Non-Stripe manual payouts)
SELECT 
    r.id AS transaction_id,
    r.created_at AS transaction_date,
    r.stripe_charge_id,
    NULL::text AS receipt_url,
    -- Resolve shareholder_id across all available sources:
    COALESCE(
        r.shareholder_id,
        p.shareholder_id,
        rr.shareholder_id,
        inv.shareholder_id
    ) AS shareholder_id,
    -- Resolve shareholder name across all available sources + metadata fallback:
    COALESCE(
        s."fullName",
        s_p."fullName",
        s_rr."fullName",
        s_inv."fullName",
        r.metadata->>'recipient_name'
    ) AS shareholder_name,
    -- Resolve shareholder email across all available sources:
    COALESCE(
        s.email,
        s_p.email,
        s_rr.email,
        s_inv.email
    ) AS shareholder_email,
    r.amount,
    r.currency,
    r.status AS payment_status,
    'redemption'::text AS payment_method_type,
    COALESCE(r.opportunity_id, p.opportunity_id, inv.opportunity_id) AS opportunity_id,
    COALESCE(o.name, 'Redemption Payout') AS opportunity_name,
    o.type AS opportunity_type,
    NULL::bigint AS fee_id,
    NULL::text AS fee_name,
    NULL::character varying AS fee_type,
    'Redemption'::text AS ledger_category,
    COALESCE(o.name, 'Redemption') AS line_item_name,
    r.description AS memo
FROM public.redemptions r
-- 1. Direct join to shareholders via redemptions.shareholder_id
LEFT JOIN public.shareholders s ON s.id = r.shareholder_id
-- 2. Join via redemption_requests
LEFT JOIN public.redemption_requests rr ON rr.id = r.redemption_request_id
LEFT JOIN public.shareholders s_rr ON s_rr.id = rr.shareholder_id
-- 3. Join via investments
LEFT JOIN public.investments inv ON inv.id = rr.investment_id
LEFT JOIN public.shareholders s_inv ON s_inv.id = inv.shareholder_id
-- 4. Join via original payment (Stripe intent, charge ID, or original_payment_id metadata)
LEFT JOIN public.payments p ON (
    (r.metadata->>'original_payment_id')::uuid = p.id
    OR (r.stripe_payment_intent_id IS NOT NULL AND r.stripe_payment_intent_id = p.stripe_payment_intent_id)
)
LEFT JOIN public.shareholders s_p ON s_p.id = p.shareholder_id
-- 5. Join opportunity
LEFT JOIN public.opportunities o ON o.id = COALESCE(r.opportunity_id, p.opportunity_id, inv.opportunity_id);

-- 2. PERMISSIONS & SECURITY
GRANT SELECT ON public.user_ledger_view TO anon, authenticated, service_role;

-- Allow view to execute with owner privileges so caller RLS doesn't block aggregated ledger reports
ALTER VIEW public.user_ledger_view SET (security_invoker = off);

-- 3. BACKFILL HISTORICAL REDEMPTIONS IN public.redemptions TABLE
UPDATE public.redemptions r
SET 
    -- A. Backfill missing shareholder_id
    shareholder_id = COALESCE(
        r.shareholder_id,
        rr.shareholder_id,
        inv.shareholder_id,
        p.shareholder_id,
        (SELECT s.id FROM public.shareholders s WHERE LOWER(s."fullName") = LOWER(r.metadata->>'recipient_name') LIMIT 1)
    ),
    -- B. Backfill missing redemption_request_id if linked
    redemption_request_id = COALESCE(
        r.redemption_request_id,
        rr.id
    ),
    -- C. Backfill synthetic identifiers for non-Stripe records so table columns are consistent
    stripe_refund_id = COALESCE(
        r.stripe_refund_id,
        'MANUAL_REF_' || UPPER(COALESCE(r.metadata->>'payout_rail', 'MANUAL')) || '_REQ_' || COALESCE(r.redemption_request_id::text, rr.id::text, '0') || '_' || EXTRACT(EPOCH FROM r.created_at)::bigint::text
    ),
    stripe_payment_intent_id = COALESCE(
        r.stripe_payment_intent_id,
        'offline_redemption_req_' || COALESCE(r.redemption_request_id::text, rr.id::text, '0') || '_opp_' || COALESCE(r.opportunity_id::text, 'general')
    ),
    stripe_charge_id = COALESCE(
        r.stripe_charge_id,
        'offline_' || LOWER(COALESCE(r.metadata->>'payout_rail', 'manual')) || '_payout'
    )
FROM public.redemptions r_src
LEFT JOIN public.redemption_requests rr ON rr.id = r_src.redemption_request_id
LEFT JOIN public.investments inv ON inv.id = rr.investment_id
LEFT JOIN public.payments p ON (
    (r_src.metadata->>'original_payment_id')::uuid = p.id
    OR (r_src.stripe_payment_intent_id IS NOT NULL AND r_src.stripe_payment_intent_id = p.stripe_payment_intent_id)
)
WHERE r.id = r_src.id;
