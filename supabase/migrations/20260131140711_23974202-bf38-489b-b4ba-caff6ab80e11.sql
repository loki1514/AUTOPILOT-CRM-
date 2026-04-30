-- Phase 4: Enterprise Email Campaign Module

-- 1. Create sender_profiles table
CREATE TABLE public.sender_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain_id uuid NOT NULL REFERENCES public.sending_domains(id) ON DELETE CASCADE,
  name text NOT NULL,
  from_email text NOT NULL,
  default_reply_to_mode text NOT NULL DEFAULT 'shared',
  default_reply_to_email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sender_profiles
ALTER TABLE public.sender_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for sender_profiles
CREATE POLICY "Users can view their own sender profiles"
  ON public.sender_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sender profiles"
  ON public.sender_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sender profiles"
  ON public.sender_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sender profiles"
  ON public.sender_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on sender_profiles
CREATE TRIGGER update_sender_profiles_updated_at
  BEFORE UPDATE ON public.sender_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add new columns to email_campaigns
ALTER TABLE public.email_campaigns 
  ADD COLUMN IF NOT EXISTS sender_profile_id uuid REFERENCES public.sender_profiles(id),
  ADD COLUMN IF NOT EXISTS reply_to_mode text NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS reply_to_email text,
  ADD COLUMN IF NOT EXISTS cc_emails text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bcc_emails text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

-- 3. Create email_outbox table
CREATE TABLE public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.campaign_recipients(id) ON DELETE CASCADE,
  resend_email_id text,
  from_name text NOT NULL,
  from_email text NOT NULL,
  reply_to text,
  to_email text NOT NULL,
  cc_emails text[],
  bcc_emails text[],
  subject text NOT NULL,
  html_snapshot text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  status_timeline jsonb NOT NULL DEFAULT '[]',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on email_outbox
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_outbox (via campaign ownership)
CREATE POLICY "Users can view outbox for their campaigns"
  ON public.email_outbox FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.email_campaigns
    WHERE email_campaigns.id = email_outbox.campaign_id
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can create outbox entries for their campaigns"
  ON public.email_outbox FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_campaigns
    WHERE email_campaigns.id = email_outbox.campaign_id
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update outbox entries for their campaigns"
  ON public.email_outbox FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.email_campaigns
    WHERE email_campaigns.id = email_outbox.campaign_id
    AND email_campaigns.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_sender_profiles_user_id ON public.sender_profiles(user_id);
CREATE INDEX idx_sender_profiles_domain_id ON public.sender_profiles(domain_id);
CREATE INDEX idx_email_outbox_campaign_id ON public.email_outbox(campaign_id);
CREATE INDEX idx_email_outbox_status ON public.email_outbox(status);
CREATE INDEX idx_email_outbox_created_at ON public.email_outbox(created_at DESC);