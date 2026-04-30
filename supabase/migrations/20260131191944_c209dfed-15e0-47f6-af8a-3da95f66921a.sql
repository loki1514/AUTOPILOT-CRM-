-- Intelligence Sources Table (RSS feeds, PDFs, docs, manual entries)
CREATE TABLE public.intelligence_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('rss', 'pdf', 'doc', 'manual')),
  name text NOT NULL,
  url text,
  file_path text,
  city text,
  micro_market text,
  intelligence_type text,
  is_active boolean DEFAULT true,
  last_fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Intelligence Items Table (individual articles/entries)
CREATE TABLE public.intelligence_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.intelligence_sources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  headline text NOT NULL,
  summary text,
  content_preview text,
  source_url text,
  city text,
  micro_market text,
  intelligence_type text,
  relevance_date date DEFAULT CURRENT_DATE,
  is_actionable boolean DEFAULT false,
  action_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Daily Briefs Table (AI-generated daily intelligence)
CREATE TABLE public.daily_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL,
  brief_date date NOT NULL DEFAULT CURRENT_DATE,
  headline text NOT NULL,
  top_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  micro_market_watch jsonb DEFAULT '[]'::jsonb,
  competitor_movement jsonb DEFAULT '[]'::jsonb,
  suggested_actions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent')),
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, city, brief_date)
);

-- BD Team Members Table (internal audience)
CREATE TABLE public.bd_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_name text NOT NULL,
  member_email text NOT NULL,
  city text NOT NULL,
  role text DEFAULT 'bd' CHECK (role IN ('bd', 'city_head', 'leadership')),
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Automation Rules Table (scheduled tasks)
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('daily_brief', 'weekly_newsletter')),
  cities text[] NOT NULL DEFAULT '{}',
  sender_profile_id uuid REFERENCES public.sender_profiles(id) ON DELETE SET NULL,
  schedule_time time DEFAULT '07:00',
  auto_approve boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.intelligence_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bd_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for intelligence_sources
CREATE POLICY "Users can view their own intelligence sources"
  ON public.intelligence_sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intelligence sources"
  ON public.intelligence_sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intelligence sources"
  ON public.intelligence_sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intelligence sources"
  ON public.intelligence_sources FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for intelligence_items
CREATE POLICY "Users can view their own intelligence items"
  ON public.intelligence_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own intelligence items"
  ON public.intelligence_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intelligence items"
  ON public.intelligence_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intelligence items"
  ON public.intelligence_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_briefs
CREATE POLICY "Users can view their own daily briefs"
  ON public.daily_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily briefs"
  ON public.daily_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily briefs"
  ON public.daily_briefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily briefs"
  ON public.daily_briefs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bd_team_members
CREATE POLICY "Users can view their own team members"
  ON public.bd_team_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own team members"
  ON public.bd_team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team members"
  ON public.bd_team_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own team members"
  ON public.bd_team_members FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for automation_rules
CREATE POLICY "Users can view their own automation rules"
  ON public.automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automation rules"
  ON public.automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation rules"
  ON public.automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation rules"
  ON public.automation_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at triggers
CREATE TRIGGER update_intelligence_sources_updated_at
  BEFORE UPDATE ON public.intelligence_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_briefs_updated_at
  BEFORE UPDATE ON public.daily_briefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();