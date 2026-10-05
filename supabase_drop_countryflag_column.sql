-- ============================================================================
-- MIGRATION: Drop countryFlag Column from shareholders table
-- ============================================================================
-- Description:
-- Drops the unused 'countryFlag' column from the public.shareholders table.
-- All references to countryFlag across server actions, queries, and modal
-- components have been cleaned up and removed.
--
-- How to apply:
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> Run).
-- ============================================================================

-- Drop the column (handling both case-sensitive and lowercase variants safely)
ALTER TABLE public.shareholders
DROP COLUMN IF EXISTS "countryFlag";

ALTER TABLE public.shareholders
DROP COLUMN IF EXISTS countryflag;

-- Verify columns on public.shareholders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'shareholders'
ORDER BY ordinal_position;
