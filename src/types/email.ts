// Campaign status enum matching database
export type CampaignStatus = 'draft' | 'approved' | 'sending' | 'sent' | 'paused';
export type DomainStatus = 'pending' | 'verified' | 'failed';
export type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';

// Email block types for visual editor
export type EmailBlockType = 'heading' | 'paragraph' | 'bullets' | 'image' | 'cta' | 'divider' | 'footer';

// Reply-to modes
export type ReplyToMode = 'shared' | 'individual' | 'custom';

// Outbox status
export type OutboxStatus = 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';

export interface EmailBlock {
  id: string;
  type: EmailBlockType;
  content: string;
  // For bullets
  items?: string[];
  // For CTA
  buttonText?: string;
  buttonUrl?: string;
  // For image
  imageUrl?: string;
  altText?: string;
}

// Database types
export interface EmailCampaign {
  id: string;
  user_id: string;
  name: string;
  purpose: string | null;
  status: CampaignStatus;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  campaign_id: string;
  subject: string;
  blocks: EmailBlock[];
  footer_address: string;
  created_at: string;
  updated_at: string;
}

export interface SendingDomain {
  id: string;
  user_id: string;
  domain: string;
  from_email: string;
  from_name: string;
  status: DomainStatus;
  resend_domain_id: string | null;
  dns_records: DnsRecord[];
  verified_at: string | null;
  created_at: string;
}

export interface DnsRecord {
  type: 'TXT' | 'CNAME' | 'MX';
  name: string;
  value: string;
  priority?: number;
  status?: 'pending' | 'verified' | 'failed' | 'not_started';
  record?: string; // Record category (DKIM, SPF, etc.)
}

export interface EmailContact {
  id: string;
  user_id: string;
  email: string;
  name: string;
  company: string | null;
  city: string | null;
  tags: string[];
  subscribed: boolean;
  unsubscribed_at: string | null;
  bounced: boolean;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  resend_email_id: string | null;
  status: RecipientStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
}

export interface EmailAnalytics {
  id: string;
  campaign_id: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  complained_count: number;
  updated_at: string;
}

// Form types
export interface CreateCampaignInput {
  name: string;
  purpose?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  purpose?: string;
  status?: CampaignStatus;
  sender_profile_id?: string | null;
  reply_to_mode?: ReplyToMode;
  reply_to_email?: string | null;
  cc_emails?: string[];
  bcc_emails?: string[];
  is_recurring?: boolean;
}

// Sender Profile
export interface SenderProfile {
  id: string;
  user_id: string;
  domain_id: string;
  name: string;
  from_email: string;
  default_reply_to_mode: ReplyToMode;
  default_reply_to_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSenderProfileInput {
  domain_id: string;
  name: string;
  from_email: string;
  default_reply_to_mode?: ReplyToMode;
  default_reply_to_email?: string;
}

// Status timeline entry for outbox
export interface StatusTimelineEntry {
  status: OutboxStatus;
  timestamp: string;
}

// Outbox entry
export interface OutboxEntry {
  id: string;
  campaign_id: string;
  recipient_id: string;
  resend_email_id: string | null;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  to_email: string;
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  subject: string;
  html_snapshot: string;
  status: OutboxStatus;
  status_timeline: StatusTimelineEntry[];
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

// Extended campaign with new fields
export interface EmailCampaignExtended extends EmailCampaign {
  sender_profile_id: string | null;
  reply_to_mode: ReplyToMode;
  reply_to_email: string | null;
  cc_emails: string[];
  bcc_emails: string[];
  is_recurring: boolean;
}
