export type LeadStage = 'lead' | 'qualified' | 'proposal' | 'closed' | 'lost';

export interface Lead {
  id: string;
  client_name: string;
  company: string;
  headcount: number;
  location: string | null;
  budget_min: number | null;
  budget_max: number | null;
  timeline: string | null;
  stage: LeadStage;
  email: string | null;
  phone: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  // CRM extensions (Phase 1)
  intent_score?: number;
  source?: LeadSource;
  intent_signals?: unknown;
  last_activity?: string;
  office_size_needed?: string | null;
  move_in_date?: string | null;
  budget_monthly?: number | null;
  city?: string | null;
  assigned_to?: string | null;
  meta_lead_id?: string | null;
  linkedin_lead_id?: string | null;
  enriched_at?: string | null;
  full_name?: string | null;
  job_title?: string | null;
  linkedin_url?: string | null;
  company_size?: string | null;
  crm_status?: CrmStatus;
  // Scoring & enrichment (Phase 2)
  verification_score?: number;
  contactability_score?: number;
  outreach_readiness?: number;
  enrichment_status?: string | null;
  disqualified_claims?: DisqualifiedClaim[];
  website?: string | null;
  company_domain?: string | null;
  perplexity_summary?: string | null;
}

// ============= CRM types (Phase 1) =============

export type CrmStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export const CRM_STATUSES: { value: CrmStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export type LeadSource =
  | 'linkedin'
  | 'meta'
  | 'apollo'
  | 'perplexity'
  | 'website'
  | 'referral'
  | 'manual'
  | 'brief';

export type ActivityType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'note'
  | 'status_change'
  | 'assignment';

export interface Activity {
  id: string;
  lead_id: string;
  rep_id: string | null;
  type: ActivityType;
  content: string | null;
  created_at: string;
}

export type SignalType =
  | 'funding_round'
  | 'headcount_growth'
  | 'job_posting'
  | 'news_mention'
  | 'linkedin_activity'
  | 'meta_engagement'
  | 'website_visit';

export interface IntentSignal {
  id: string;
  lead_id: string;
  signal_type: SignalType;
  signal_value: string | null;
  detected_at: string;
  source_api: string | null;
  score_contribution: number;
  claim: string | null;
  source_url: string | null;
  source_type: string | null;
  source_title: string | null;
  event_date: string | null;
  published_date: string | null;
  confidence: number | null;
  verification_status: string | null;
  why_it_matters: string | null;
}

export interface LeadContact {
  id: string;
  lead_id: string;
  full_name: string;
  title: string | null;
  seniority: string | null;
  priority_rank: number;
  linkedin_url: string | null;
  email: string | null;
  email_status: string | null;
  phone: string | null;
  photo_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  departments: string[];
  apollo_person_id: string | null;
  enriched_at: string;
  created_at: string;
}

export interface DisqualifiedClaim {
  claim: string;
  reason: string;
}

export interface BdRep {
  id: string;
  user_id: string;
  member_name: string;
  member_email: string;
  city: string;
  role: string | null;
  is_active: boolean | null;
  created_at: string;
  avatar_url: string | null;
  max_leads: number;
  city_focus: string[];
  active_leads_count?: number;
}

export interface Requirement {
  id: string;
  lead_id: string;
  city: string;
  micro_market: string | null;
  target_seats: number;
  budget_per_seat: number | null;
  preferred_move_in: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpaceModule {
  type: 'workstation' | 'cabin_small' | 'cabin_large' | 'meeting_room_small' | 'meeting_room_large' | 'conference_room' | 'phone_booth' | 'break_area' | 'reception' | 'server_room';
  name: string;
  quantity: number;
  area_sqft: number;
  seats: number;
}

export interface SpaceCalculation {
  id: string;
  lead_id: string;
  modules: SpaceModule[];
  total_carpet_area: number;
  total_seats: number;
  created_at: string;
  updated_at: string;
}

export interface CostAnalysis {
  id: string;
  lead_id: string;
  rent_per_sqft: number;
  opex_per_sqft: number;
  fitout_per_sqft: number;
  cost_per_seat: number | null;
  total_monthly_cost: number | null;
  total_fitout_cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface LayoutImage {
  id: string;
  lead_id: string;
  image_url: string | null;
  generated_at: string;
}

// Predefined module specifications
export const SPACE_MODULES: Record<SpaceModule['type'], { name: string; area_sqft: number; seats: number }> = {
  workstation: { name: 'Workstation', area_sqft: 50, seats: 1 },
  cabin_small: { name: 'Small Cabin (Manager)', area_sqft: 100, seats: 1 },
  cabin_large: { name: 'Large Cabin (Director)', area_sqft: 150, seats: 1 },
  meeting_room_small: { name: 'Meeting Room (4 pax)', area_sqft: 120, seats: 4 },
  meeting_room_large: { name: 'Meeting Room (8 pax)', area_sqft: 200, seats: 8 },
  conference_room: { name: 'Conference Room (20 pax)', area_sqft: 400, seats: 20 },
  phone_booth: { name: 'Phone Booth', area_sqft: 25, seats: 1 },
  break_area: { name: 'Break Area / Pantry', area_sqft: 200, seats: 0 },
  reception: { name: 'Reception Area', area_sqft: 150, seats: 0 },
  server_room: { name: 'Server Room', area_sqft: 80, seats: 0 },
};
