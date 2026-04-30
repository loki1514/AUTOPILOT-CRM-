-- =========================================================
-- 1. EXTEND leads TABLE
-- =========================================================
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS intent_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS intent_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_activity timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS office_size_needed text,
  ADD COLUMN IF NOT EXISTS move_in_date date,
  ADD COLUMN IF NOT EXISTS budget_monthly int,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS meta_lead_id text,
  ADD COLUMN IF NOT EXISTS linkedin_lead_id text,
  ADD COLUMN IF NOT EXISTS enriched_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS crm_status text NOT NULL DEFAULT 'new';

-- Constrain crm_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_crm_status_check'
  ) THEN
    ALTER TABLE public.leads
      ADD CONSTRAINT leads_crm_status_check
      CHECK (crm_status IN ('new','contacted','qualified','proposal','negotiation','won','lost'));
  END IF;
END$$;

-- Unique partial indexes for dedup (allow many NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS leads_meta_lead_id_unique
  ON public.leads (meta_lead_id) WHERE meta_lead_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS leads_linkedin_lead_id_unique
  ON public.leads (linkedin_lead_id) WHERE linkedin_lead_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_assigned_to_idx ON public.leads (assigned_to);
CREATE INDEX IF NOT EXISTS leads_crm_status_idx ON public.leads (crm_status);
CREATE INDEX IF NOT EXISTS leads_source_idx ON public.leads (source);

-- =========================================================
-- 2. EXTEND bd_team_members TABLE
-- =========================================================
ALTER TABLE public.bd_team_members
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS max_leads int NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS city_focus text[] NOT NULL DEFAULT '{}'::text[];

-- =========================================================
-- 3. NEW TABLE: activities
-- =========================================================
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  rep_id uuid REFERENCES public.bd_team_members(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('email','call','meeting','note','status_change','assignment')),
  content text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activities_lead_id_idx ON public.activities (lead_id);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON public.activities (created_at DESC);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their leads"
  ON public.activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = activities.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can insert activities for their leads"
  ON public.activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = activities.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can update activities for their leads"
  ON public.activities FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = activities.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can delete activities for their leads"
  ON public.activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = activities.lead_id AND leads.user_id = auth.uid()));

-- =========================================================
-- 4. NEW TABLE: intent_signals
-- =========================================================
CREATE TABLE IF NOT EXISTS public.intent_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('funding_round','headcount_growth','job_posting','news_mention','linkedin_activity','meta_engagement','website_visit')),
  signal_value text,
  detected_at timestamptz NOT NULL DEFAULT now(),
  source_api text CHECK (source_api IN ('perplexity','apollo','scrapingbee','linkedin','meta','brief','manual')),
  score_contribution int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS intent_signals_lead_id_idx ON public.intent_signals (lead_id);
CREATE INDEX IF NOT EXISTS intent_signals_detected_at_idx ON public.intent_signals (detected_at DESC);

ALTER TABLE public.intent_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view intent signals for their leads"
  ON public.intent_signals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = intent_signals.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can insert intent signals for their leads"
  ON public.intent_signals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = intent_signals.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can update intent signals for their leads"
  ON public.intent_signals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = intent_signals.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "Users can delete intent signals for their leads"
  ON public.intent_signals FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = intent_signals.lead_id AND leads.user_id = auth.uid()));

-- =========================================================
-- 5. VIEW: bd_reps_with_load (security_invoker so RLS applies)
-- =========================================================
DROP VIEW IF EXISTS public.bd_reps_with_load;
CREATE VIEW public.bd_reps_with_load
WITH (security_invoker = true)
AS
SELECT
  r.*,
  COALESCE((
    SELECT count(*)::int
    FROM public.leads l
    WHERE l.assigned_to = r.id
      AND l.crm_status NOT IN ('won','lost')
  ), 0) AS active_leads_count
FROM public.bd_team_members r;

-- =========================================================
-- 6. TRIGGERS to keep last_activity fresh
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_lead_last_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_touch_last_activity ON public.leads;
CREATE TRIGGER trg_leads_touch_last_activity
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_lead_last_activity();

CREATE OR REPLACE FUNCTION public.bump_lead_last_activity_from_activity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads SET last_activity = NEW.created_at WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_activities_bump_lead ON public.activities;
CREATE TRIGGER trg_activities_bump_lead
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.bump_lead_last_activity_from_activity();

-- =========================================================
-- 7. REALTIME
-- =========================================================
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'activities'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
  END IF;
END$$;