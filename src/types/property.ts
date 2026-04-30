export interface Property {
  id: string;
  property_name: string;
  location: string | null;
  developer_name: string | null;
  carpet_area: number | null;
  built_up_area: number | null;
  total_seats: number | null;
  rent_per_sqft: number | null;
  cam_charges: number | null;
  lease_term: string | null;
  escalation: number | null;
  security_deposit: string | null;
  amenities: string[];
  custom_fields: CustomFieldData[];
  key_distances: KeyDistanceData[];
  images: string[];
  company_name: string | null;
  company_tagline: string | null;
  company_description: string | null;
  company_logo_url: string | null;
  team_image_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_address: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomFieldData {
  id: string;
  label: string;
  value: string;
}

export interface KeyDistanceData {
  id: string;
  place: string;
  distance: string;
}

export type LeadPropertyStage = 'available' | 'assigned' | 'brochure_sent';

export interface LeadProperty {
  id: string;
  lead_id: string;
  property_id: string;
  stage: LeadPropertyStage;
  notes: string | null;
  assigned_at: string | null;
  brochure_sent_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export const LEAD_PROPERTY_STAGES: { value: LeadPropertyStage; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'brochure_sent', label: 'Brochure Sent' },
];
