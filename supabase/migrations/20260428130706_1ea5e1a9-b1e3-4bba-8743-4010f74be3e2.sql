-- 1. Intent Indicators (tunable signal types)
CREATE TABLE public.intent_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  weight integer NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  color text NOT NULL DEFAULT '#3B82F6',
  icon text NOT NULL DEFAULT 'sparkles',
  detection_keywords text[] DEFAULT '{}',
  signals_detected integer NOT NULL DEFAULT 0,
  signals_converted integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intent_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own indicators" ON public.intent_indicators FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own indicators" ON public.intent_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own indicators" ON public.intent_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own indicators" ON public.intent_indicators FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_intent_indicators_updated_at
  BEFORE UPDATE ON public.intent_indicators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Extend daily_briefs with structured intelligence sections
ALTER TABLE public.daily_briefs
  ADD COLUMN IF NOT EXISTS expiring_leases jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS funded_startups jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS competitor_alerts jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS bd_tips jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS city_actionables jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS generated_by text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS created_lead_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- 3. Extend intent_signals with indicator linkage + conversion tracking
ALTER TABLE public.intent_signals
  ADD COLUMN IF NOT EXISTS indicator_id uuid REFERENCES public.intent_indicators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS converted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS brief_id uuid REFERENCES public.daily_briefs(id) ON DELETE SET NULL;

-- 4. Extend bd_team_members with whatsapp
ALTER TABLE public.bd_team_members
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- 5. Helper to seed default indicators for a user
CREATE OR REPLACE FUNCTION public.seed_default_indicators(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.intent_indicators (user_id, name, description, category, weight, color, icon, detection_keywords) VALUES
    (_user_id, 'Funding Raised', 'Company raised a funding round in last 30 days', 'funding', 30, '#10B981', 'trending-up', ARRAY['raised','funding','series','seed']),
    (_user_id, 'Lease Expiring <60d', 'Current office lease ends within 60 days', 'lease', 35, '#F59E0B', 'calendar-clock', ARRAY['lease end','expiring','vacating']),
    (_user_id, 'Headcount +10% (90d)', 'Team grew 10% or more in the last 90 days', 'growth', 20, '#3B82F6', 'users', ARRAY['hiring','headcount','team grew']),
    (_user_id, 'Competitor Exit Nearby', 'Competitor coworking exited the micro-market', 'competitor', 15, '#EF4444', 'shield-alert', ARRAY['exit','vacated','closed']),
    (_user_id, 'Job Posts Spike', 'Company posted 5+ new jobs in 30 days', 'growth', 15, '#8B5CF6', 'briefcase', ARRAY['hiring','jobs','careers']),
    (_user_id, 'Replied to Outreach', 'Lead replied to BD outreach', 'engagement', 25, '#EC4899', 'message-square', ARRAY['replied','responded'])
  ON CONFLICT DO NOTHING;
END;
$$;