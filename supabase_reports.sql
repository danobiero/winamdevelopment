-- ============================================================
-- SQL REFERENCE: DOCUMENT CLASSIFICATION & SEPARATION
-- ============================================================
-- All documents attached to opportunities are stored in the
-- 'opportunity_documents' table and Supabase storage.
--
-- To separate Meeting Reports (General / Project) from other documents
-- (such as brochures, investor decks, legal agreements):
--
-- 1. In the application:
--    - Reports are saved with prefix "[General]" or "[Project]" and stored
--      under the 'reports/' subfolder path.
--    - Brochures and other documents do not have this tag and are stored
--      directly under 'opportunity_<id>/'.
--    - The reports dashboard automatically filters out any document that
--      does not match GENERAL or PROJECT.
--
-- 2. Optional Database Column (Recommended for explicit classification):
--    You can run this query in Supabase SQL Editor to add an explicit
--    'document_type' column to 'opportunity_documents':

ALTER TABLE public.opportunity_documents
  ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'general_doc'
  CHECK (document_type IN ('General', 'Project', 'brochure', 'agreement', 'general_doc'));

-- Automatically backfill existing reports based on title / path:
UPDATE public.opportunity_documents
  SET document_type = 'General'
  WHERE name ILIKE '[General]%' OR name ILIKE '%[General]%';

UPDATE public.opportunity_documents
  SET document_type = 'Project'
  WHERE name ILIKE '[Project]%' OR name ILIKE '%[Project]%';

-- Backfill non-reports as 'brochure' / 'general_doc':
UPDATE public.opportunity_documents
  SET document_type = 'brochure'
  WHERE document_type IS NULL OR document_type = 'general_doc'
    AND NOT (name ILIKE '[General]%' OR name ILIKE '[Project]%');

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_opportunity_documents_type 
  ON public.opportunity_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_opportunity_documents_opp_id 
  ON public.opportunity_documents(opportunity_id);
