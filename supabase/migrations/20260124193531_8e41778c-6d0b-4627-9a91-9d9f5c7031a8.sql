-- Create space_library table
CREATE TABLE public.space_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  width_ft NUMERIC,
  length_ft NUMERIC,
  area_sqft NUMERIC NOT NULL,
  seats INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_standard BOOLEAN NOT NULL DEFAULT true,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.space_library ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for Phase 1)
CREATE POLICY "Allow public read access to space_library" 
ON public.space_library 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to space_library" 
ON public.space_library 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to space_library" 
ON public.space_library 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to space_library" 
ON public.space_library 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_space_library_updated_at
BEFORE UPDATE ON public.space_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for space images
INSERT INTO storage.buckets (id, name, public) VALUES ('space-images', 'space-images', true);

-- Create storage policies
CREATE POLICY "Space images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'space-images');

CREATE POLICY "Anyone can upload space images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'space-images');

CREATE POLICY "Anyone can update space images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'space-images');

CREATE POLICY "Anyone can delete space images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'space-images');

-- Seed standard spaces (27 items)
INSERT INTO public.space_library (name, category, width_ft, length_ft, area_sqft, seats, is_custom, is_standard) VALUES
-- Cabins
('CABIN 01', 'Cabin', 8, 10, 80, 1, false, true),
('CABIN 02', 'Cabin', 10, 11, 110, 1, false, true),
('CEO CABIN (WITH 2 SEATER SOFA)', 'Cabin', 10, 13, 130, 1, false, true),
('CEO CABIN (WITH 3 SEATER SOFA)', 'Cabin', 10, 15, 150, 1, false, true),
-- Meeting / Conference
('4 SEAT MEETING ROOM', 'Meeting / Conference', 9, 10, 90, 4, false, true),
('4 SEAT MEETING ROOM (ROUND TABLE)', 'Meeting / Conference', 9, 10, 90, 4, false, true),
('6 SEAT MEETING ROOM', 'Meeting / Conference', 11, 14, 154, 6, false, true),
('8 SEAT MEETING ROOM', 'Meeting / Conference', 11, 14, 154, 8, false, true),
('CONFERENCE ROOM (14 SEAT) - 23''x11''', 'Meeting / Conference', 23, 11, 253, 14, false, true),
('CONFERENCE ROOM (14 SEAT) - 24''x11''', 'Meeting / Conference', 24, 11, 264, 14, false, true),
('TRAINING ROOM (25 SEAT)', 'Meeting / Conference', 21, 24, 504, 25, false, true),
-- Workstations
('2''8"X1''8" WORKSTATION', 'Workstation', 2.67, 1.67, 11, 1, false, true),
('3''0"X2''0" WORKSTATION', 'Workstation', 3, 2, 14, 1, false, true),
('3''6"X2''0" WORKSTATION', 'Workstation', 3.5, 2, 16, 1, false, true),
('4''0"X2''0" WORKSTATION', 'Workstation', 4, 2, 18, 1, false, true),
-- Cubicles
('3''8"X3''8" CUBICLE', 'Cubicle', 3.67, 3.67, 23, 1, false, true),
('5''0"X4''6" CUBICLE', 'Cubicle', 5, 4.5, 25, 1, false, true),
('5''0"X5''0" CUBICLE', 'Cubicle', 5, 5, 28, 1, false, true),
('5''4"X5''4" CUBICLE', 'Cubicle', 5.33, 5.33, 28, 1, false, true),
('7''4"X7''4" CUBICLE', 'Cubicle', 7.33, 7.33, 54, 1, false, true),
-- Support Areas
('4''10"X1''8" RECEPTION', 'Support', 4.83, 1.67, 68, 0, false, true),
('4''3"X2''1" RECEPTION', 'Support', 4.25, 2.08, 65, 0, false, true),
('8''0"X2''6" RECEPTION', 'Support', 8, 2.5, 105, 0, false, true),
('3''6"X2''6" INTERVIEW ROOM', 'Support', 3.5, 2.5, 55, 2, false, true),
('PHONEBOOTH 01', 'Support', 3.5, 4, 14, 1, false, true),
('PHONEBOOTH 02', 'Support', 3.5, 3.5, 12, 1, false, true),
('PHONEBOOTH 03', 'Support', 3, 4, 12, 1, false, true);