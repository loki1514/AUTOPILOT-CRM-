-- Create enums for campaign status and recipient status
CREATE TYPE public.campaign_status AS ENUM ('draft', 'approved', 'sending', 'sent', 'paused');
CREATE TYPE public.domain_status AS ENUM ('pending', 'verified', 'failed');
CREATE TYPE public.recipient_status AS ENUM ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained');

-- 1. email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  purpose TEXT,
  status campaign_status NOT NULL DEFAULT 'draft',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns" ON public.email_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON public.email_campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON public.email_campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON public.email_campaigns
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. email_templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  footer_address TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates for their campaigns" ON public.email_templates
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_templates.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can create templates for their campaigns" ON public.email_templates
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_templates.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update templates for their campaigns" ON public.email_templates
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_templates.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete templates for their campaigns" ON public.email_templates
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_templates.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. sending_domains table
CREATE TABLE public.sending_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT NOT NULL DEFAULT '',
  status domain_status NOT NULL DEFAULT 'pending',
  resend_domain_id TEXT,
  dns_records JSONB DEFAULT '[]'::jsonb,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sending_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own domains" ON public.sending_domains
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own domains" ON public.sending_domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own domains" ON public.sending_domains
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own domains" ON public.sending_domains
  FOR DELETE USING (auth.uid() = user_id);

-- 4. email_contacts table
CREATE TABLE public.email_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  company TEXT,
  city TEXT,
  tags TEXT[] DEFAULT '{}',
  subscribed BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  bounced BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" ON public.email_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" ON public.email_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON public.email_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON public.email_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- 5. campaign_recipients table
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.email_contacts(id) ON DELETE CASCADE,
  status recipient_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(campaign_id, contact_id)
);

ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipients for their campaigns" ON public.campaign_recipients
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = campaign_recipients.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can create recipients for their campaigns" ON public.campaign_recipients
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = campaign_recipients.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update recipients for their campaigns" ON public.campaign_recipients
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = campaign_recipients.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete recipients for their campaigns" ON public.campaign_recipients
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = campaign_recipients.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

-- 6. email_analytics table
CREATE TABLE public.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  bounced_count INTEGER NOT NULL DEFAULT 0,
  complained_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analytics for their campaigns" ON public.email_analytics
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_analytics.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can create analytics for their campaigns" ON public.email_analytics
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_analytics.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE POLICY "Users can update analytics for their campaigns" ON public.email_analytics
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.email_campaigns 
    WHERE email_campaigns.id = email_analytics.campaign_id 
    AND email_campaigns.user_id = auth.uid()
  ));

CREATE TRIGGER update_email_analytics_updated_at
  BEFORE UPDATE ON public.email_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();