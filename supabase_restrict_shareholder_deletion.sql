-- ============================================================================
-- SQL MIGRATION: RESTRICT DELETING SHAREHOLDER WITH INVESTMENTS
-- ============================================================================
-- Description:
-- Prevents accidental or intentional deletion of a shareholder from the 
-- 'shareholders' table if they have any existing investment allocations in the
-- 'investments' table.
--
-- This script provides two complementary layers of protection:
-- 1. Relational Foreign Key Constraint: 'ON DELETE RESTRICT'
-- 2. Custom Business-Logic Trigger: Throws a clear, descriptive error message
--
-- How to apply:
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> Run).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- LAYER 1: FOREIGN KEY CONSTRAINT (ON DELETE RESTRICT)
-- ----------------------------------------------------------------------------
-- Drop any existing foreign key constraint on investments(shareholder_id)
-- so it cannot silently CASCADE or SET NULL.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'investments'
          AND kcu.column_name = 'shareholder_id'
          AND ccu.table_name = 'shareholders'
    ) LOOP
        EXECUTE 'ALTER TABLE public.investments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add strict ON DELETE RESTRICT constraint
ALTER TABLE public.investments
ADD CONSTRAINT fk_investments_shareholder_restrict
FOREIGN KEY (shareholder_id)
REFERENCES public.shareholders(id)
ON DELETE RESTRICT;


-- ----------------------------------------------------------------------------
-- LAYER 2: DESCRIPTIVE AUDIT TRIGGER
-- ----------------------------------------------------------------------------
-- Provides human-readable error messages detailing the exact shareholder name,
-- shareholder ID, and total count of active investments blocking the deletion.

CREATE OR REPLACE FUNCTION public.prevent_delete_shareholder_with_investments()
RETURNS TRIGGER AS $$
DECLARE
    active_inv_count INT;
    total_inv_count INT;
    total_capital NUMERIC;
BEGIN
    -- Count all investment allocations for this shareholder
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active'),
        COALESCE(SUM(amount_invested), 0)
    INTO 
        total_inv_count,
        active_inv_count,
        total_capital
    FROM public.investments
    WHERE shareholder_id = OLD.id;

    -- If investments exist, block the deletion with a clear diagnostic error
    IF total_inv_count > 0 THEN
        RAISE EXCEPTION 'CANNOT_DELETE_SHAREHOLDER: Shareholder "%" (ID: #%) cannot be deleted because they have % investment record(s) (% active, $% total invested). You must exit, liquidate, or reassign their investments before deleting this profile.',
            OLD."fullName",
            OLD.id,
            total_inv_count,
            active_inv_count,
            total_capital;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the shareholders table
DROP TRIGGER IF EXISTS trg_prevent_delete_shareholder_with_investments ON public.shareholders;

CREATE TRIGGER trg_prevent_delete_shareholder_with_investments
BEFORE DELETE ON public.shareholders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_delete_shareholder_with_investments();


-- ----------------------------------------------------------------------------
-- VERIFICATION
-- ----------------------------------------------------------------------------
SELECT 
    conname AS constraint_name, 
    contype AS constraint_type, 
    confdeltype AS on_delete_action
FROM pg_constraint 
WHERE conname = 'fk_investments_shareholder_restrict';
