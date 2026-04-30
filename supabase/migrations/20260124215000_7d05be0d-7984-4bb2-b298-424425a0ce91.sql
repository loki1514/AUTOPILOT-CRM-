-- Create properties table with full brochure data
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name TEXT NOT NULL,
  location TEXT,
  developer_name TEXT,
  
  -- Commercial Details
  carpet_area NUMERIC,
  built_up_area NUMERIC,
  total_seats INTEGER,
  rent_per_sqft NUMERIC,
  cam_charges NUMERIC,
  lease_term TEXT,
  escalation NUMERIC,
  security_deposit TEXT,
  
  -- Amenities (stored as array)
  amenities TEXT[] DEFAULT '{}',
  
  -- Custom Fields (stored as JSONB)
  custom_fields JSONB DEFAULT '[]',
  
  -- Key Distances (stored as JSONB)
  key_distances JSONB DEFAULT '[]',
  
  -- Images (stored as array of URLs)
  images TEXT[] DEFAULT '{}',
  
  -- Company Info
  company_name TEXT,
  company_tagline TEXT,
  company_description TEXT,
  company_logo_url TEXT,
  team_image_url TEXT,
  
  -- Contact Info
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for properties (public access for now)
CREATE POLICY "Allow public read access to properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to properties" ON public.properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to properties" ON public.properties FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to properties" ON public.properties FOR DELETE USING (true);

-- Create lead_properties junction table with Kanban stages
CREATE TABLE public.lead_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'available' CHECK (stage IN ('available', 'assigned', 'brochure_sent')),
  notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  brochure_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate property assignments to same lead
  UNIQUE(lead_id, property_id)
);

-- Enable RLS
ALTER TABLE public.lead_properties ENABLE ROW LEVEL SECURITY;

-- RLS policies for lead_properties
CREATE POLICY "Allow public read access to lead_properties" ON public.lead_properties FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to lead_properties" ON public.lead_properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to lead_properties" ON public.lead_properties FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to lead_properties" ON public.lead_properties FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_properties_updated_at
  BEFORE UPDATE ON public.lead_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Storage policies for property-images bucket
CREATE POLICY "Property images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Anyone can upload property images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images');
CREATE POLICY "Anyone can update property images" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images');
CREATE POLICY "Anyone can delete property images" ON storage.objects FOR DELETE USING (bucket_id = 'property-images');