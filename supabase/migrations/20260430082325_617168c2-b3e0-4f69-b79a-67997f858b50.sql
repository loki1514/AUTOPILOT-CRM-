alter table public.intent_signals
  add column if not exists claim text,
  add column if not exists source_url text,
  add column if not exists source_type text,
  add column if not exists source_title text,
  add column if not exists event_date date,
  add column if not exists published_date date,
  add column if not exists confidence integer,
  add column if not exists verification_status text,
  add column if not exists why_it_matters text;

alter table public.leads
  add column if not exists disqualified_claims jsonb not null default '[]'::jsonb,
  add column if not exists verification_score integer not null default 0,
  add column if not exists contactability_score integer not null default 0,
  add column if not exists outreach_readiness integer not null default 0;

create index if not exists idx_intent_signals_lead_verified
  on public.intent_signals(lead_id, verification_status);

create index if not exists idx_leads_outreach_readiness
  on public.leads(outreach_readiness desc);