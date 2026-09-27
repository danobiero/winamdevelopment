-- ============================================================
-- SQL SCRIPT: ADD PAYMENT MODE TO SETTINGS TABLE
-- Run this in your Supabase SQL Editor.
-- ============================================================

-- Add payment_mode column to settings if not exists (default 'manual')
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'manual';

-- Ensure row 1 has a default value ('manual' or 'stripe')
UPDATE public.settings 
SET payment_mode = 'manual' 
WHERE id = 1 AND payment_mode IS NULL;

-- If settings table doesn't have row 1 yet, insert one
INSERT INTO public.settings (id, payment_mode, company_name)
VALUES (1, 'manual', 'Winam Development Group')
ON CONFLICT (id) DO UPDATE
SET payment_mode = COALESCE(public.settings.payment_mode, 'manual');
