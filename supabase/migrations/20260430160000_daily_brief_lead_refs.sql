-- Add lead_references to daily_briefs for tracking real enriched lead sources
ALTER TABLE public.daily_briefs
  ADD COLUMN IF NOT EXISTS lead_references jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

COMMENT ON COLUMN public.daily_briefs.lead_references IS
  'Maps brief sections to source lead IDs: {"expiring_leases":["uuid"],"funded_startups":["uuid"],...}';
