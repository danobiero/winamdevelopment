-- ============================================================
-- SQL SCRIPT: ADD SYSTEM MAINTENANCE SETTINGS
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- 1. Add maintenance columns to public.settings if they do not exist
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS is_maintenance_mode BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS maintenance_start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS maintenance_end_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS maintenance_message TEXT,
ADD COLUMN IF NOT EXISTS maintenance_updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Initialize default values for existing row 1 if null
UPDATE public.settings
SET 
  is_maintenance_mode = COALESCE(is_maintenance_mode, FALSE),
  maintenance_updated_at = COALESCE(maintenance_updated_at, NOW())
WHERE id = 1;
