-- Extend leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS company_domain text,
  ADD COLUMN IF NOT EXISTS apollo_org_id text,
  ADD COLUMN IF NOT EXISTS perplexity_summary text,
  ADD COLUMN IF NOT EXISTS last_enriched_provider text;

-- integration_status table
CREATE TABLE IF NOT EXISTS public.integration_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  total_calls_today integer NOT NULL DEFAULT 0,
  total_leads_ingested integer NOT NULL DEFAULT 0,
  credits_remaining integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  counter_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.integration_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own integration status" ON public.integration_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own integration status" ON public.integration_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own integration status" ON public.integration_status FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own integration status" ON public.integration_status FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_integration_status_updated_at
  BEFORE UPDATE ON public.integration_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- lead_contacts table
CREATE TABLE IF NOT EXISTS public.lead_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL,
  full_name text NOT NULL,
  title text,
  seniority text,
  priority_rank integer NOT NULL DEFAULT 99,
  linkedin_url text,
  email text,
  email_status text,
  phone text,
  photo_url text,
  city text,
  state text,
  country text,
  departments text[] NOT NULL DEFAULT '{}',
  apollo_person_id text,
  enriched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS lead_contacts_lead_linkedin_uq
  ON public.lead_contacts (lead_id, linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS lead_contacts_lead_idx ON public.lead_contacts (lead_id);

ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view contacts for their leads" ON public.lead_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_contacts.lead_id AND l.user_id = auth.uid()));
CREATE POLICY "Users insert contacts for their leads" ON public.lead_contacts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_contacts.lead_id AND l.user_id = auth.uid()));
CREATE POLICY "Users update contacts for their leads" ON public.lead_contacts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_contacts.lead_id AND l.user_id = auth.uid()));
CREATE POLICY "Users delete contacts for their leads" ON public.lead_contacts FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_contacts.lead_id AND l.user_id = auth.uid()));

-- enrichment_jobs table
CREATE TABLE IF NOT EXISTS public.enrichment_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lead_id uuid,
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb,
  error text,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS enrichment_jobs_user_provider_idx ON public.enrichment_jobs (user_id, provider, created_at DESC);
CREATE INDEX IF NOT EXISTS enrichment_jobs_lead_idx ON public.enrichment_jobs (lead_id);

ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrichment jobs" ON public.enrichment_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own enrichment jobs" ON public.enrichment_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own enrichment jobs" ON public.enrichment_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own enrichment jobs" ON public.enrichment_jobs FOR DELETE USING (auth.uid() = user_id);

-- helper RPC to atomically bump integration status counters
CREATE OR REPLACE FUNCTION public.bump_integration_status(
  _user_id uuid,
  _provider text,
  _success boolean,
  _error text DEFAULT NULL,
  _credits_remaining integer DEFAULT NULL,
  _leads_ingested integer DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.integration_status (user_id, provider, last_sync_at, last_success_at, last_error, total_calls_today, total_leads_ingested, credits_remaining, counter_date)
  VALUES (
    _user_id, _provider, now(),
    CASE WHEN _success THEN now() ELSE NULL END,
    CASE WHEN _success THEN NULL ELSE _error END,
    1, _leads_ingested, _credits_remaining, CURRENT_DATE
  )
  ON CONFLICT (user_id, provider) DO UPDATE SET
    last_sync_at = now(),
    last_success_at = CASE WHEN _success THEN now() ELSE integration_status.last_success_at END,
    last_error = CASE WHEN _success THEN NULL ELSE _error END,
    total_calls_today = CASE
      WHEN integration_status.counter_date = CURRENT_DATE THEN integration_status.total_calls_today + 1
      ELSE 1
    END,
    counter_date = CURRENT_DATE,
    total_leads_ingested = integration_status.total_leads_ingested + _leads_ingested,
    credits_remaining = COALESCE(_credits_remaining, integration_status.credits_remaining),
    updated_at = now();
END;
$$;