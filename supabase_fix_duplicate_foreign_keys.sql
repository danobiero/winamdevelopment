-- ============================================================
-- SQL SCRIPT: FIX DUPLICATE FOREIGN KEYS (RESOLVES PGRST201)
-- ============================================================
-- Issue:
-- Duplicate foreign key constraints exist on 'payments' and 'redemptions'
-- pointing to 'shareholders(id)'.
--
-- When PostgREST sees more than one foreign key between two tables,
-- it throws error PGRST201:
-- "Could not embed because more than one relationship was found for 'payments' and 'shareholders'"
--
-- This crashes the /admin/payments ledger page.
--
-- Solution:
-- Drop the redundant duplicate constraints 'fk_payments_shareholder'
-- and 'fk_redemptions_shareholder'. The primary standard constraints
-- ('payments_shareholder_id_fkey' and 'redemptions_shareholder_id_fkey')
-- remain intact and maintain full relational integrity.
-- ============================================================

-- 1. Drop redundant constraint on payments
ALTER TABLE public.payments 
  DROP CONSTRAINT IF EXISTS fk_payments_shareholder;

-- 2. Drop redundant constraint on redemptions
ALTER TABLE public.redemptions 
  DROP CONSTRAINT IF EXISTS fk_redemptions_shareholder;

-- 3. Signal PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
