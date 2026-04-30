ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS dm_name text,
  ADD COLUMN IF NOT EXISTS dm_title text,
  ADD COLUMN IF NOT EXISTS dm_linkedin_url text,
  ADD COLUMN IF NOT EXISTS dm_confidence text;