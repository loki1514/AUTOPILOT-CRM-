-- Create enum for lead stages
CREATE TYPE public.lead_stage AS ENUM ('lead', 'qualified', 'proposal', 'closed', 'lost');

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  company TEXT NOT NULL,
  headcount INTEGER NOT NULL DEFAULT 10,
  location TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  timeline TEXT,
  stage lead_stage NOT NULL DEFAULT 'lead',
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create requirements table
CREATE TABLE public.requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  city TEXT NOT NULL,
  micro_market TEXT,
  target_seats INTEGER NOT NULL,
  budget_per_seat INTEGER,
  preferred_move_in DATE,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create space calculations table
CREATE TABLE public.space_calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  modules JSONB NOT NULL DEFAULT '[]',
  total_carpet_area NUMERIC NOT NULL DEFAULT 0,
  total_seats INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cost analysis table
CREATE TABLE public.cost_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  rent_per_sqft NUMERIC NOT NULL DEFAULT 80,
  opex_per_sqft NUMERIC NOT NULL DEFAULT 20,
  fitout_per_sqft NUMERIC NOT NULL DEFAULT 1500,
  cost_per_seat NUMERIC,
  total_monthly_cost NUMERIC,
  total_fitout_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create layout images table
CREATE TABLE public.layout_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_images ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth for MVP)
CREATE POLICY "Allow public read access to leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to leads" ON public.leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to leads" ON public.leads FOR DELETE USING (true);

CREATE POLICY "Allow public read access to requirements" ON public.requirements FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to requirements" ON public.requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to requirements" ON public.requirements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to requirements" ON public.requirements FOR DELETE USING (true);

CREATE POLICY "Allow public read access to space_calculations" ON public.space_calculations FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to space_calculations" ON public.space_calculations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to space_calculations" ON public.space_calculations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to space_calculations" ON public.space_calculations FOR DELETE USING (true);

CREATE POLICY "Allow public read access to cost_analyses" ON public.cost_analyses FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to cost_analyses" ON public.cost_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to cost_analyses" ON public.cost_analyses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to cost_analyses" ON public.cost_analyses FOR DELETE USING (true);

CREATE POLICY "Allow public read access to layout_images" ON public.layout_images FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to layout_images" ON public.layout_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to layout_images" ON public.layout_images FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access to layout_images" ON public.layout_images FOR DELETE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_space_calculations_updated_at BEFORE UPDATE ON public.space_calculations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cost_analyses_updated_at BEFORE UPDATE ON public.cost_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();