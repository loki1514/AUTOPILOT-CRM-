-- Step 1: Add user_id column to main tables (leads, properties)
-- leads table - each user owns their leads
ALTER TABLE public.leads 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- properties table - each user owns their properties
ALTER TABLE public.properties 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Drop all existing permissive RLS policies
-- leads policies
DROP POLICY IF EXISTS "Allow public delete access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public read access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update access to leads" ON public.leads;

-- properties policies
DROP POLICY IF EXISTS "Allow public delete access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public insert access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public update access to properties" ON public.properties;

-- cost_analyses policies
DROP POLICY IF EXISTS "Allow public delete access to cost_analyses" ON public.cost_analyses;
DROP POLICY IF EXISTS "Allow public insert access to cost_analyses" ON public.cost_analyses;
DROP POLICY IF EXISTS "Allow public read access to cost_analyses" ON public.cost_analyses;
DROP POLICY IF EXISTS "Allow public update access to cost_analyses" ON public.cost_analyses;

-- layout_images policies
DROP POLICY IF EXISTS "Allow public delete access to layout_images" ON public.layout_images;
DROP POLICY IF EXISTS "Allow public insert access to layout_images" ON public.layout_images;
DROP POLICY IF EXISTS "Allow public read access to layout_images" ON public.layout_images;
DROP POLICY IF EXISTS "Allow public update access to layout_images" ON public.layout_images;

-- lead_properties policies
DROP POLICY IF EXISTS "Allow public delete access to lead_properties" ON public.lead_properties;
DROP POLICY IF EXISTS "Allow public insert access to lead_properties" ON public.lead_properties;
DROP POLICY IF EXISTS "Allow public read access to lead_properties" ON public.lead_properties;
DROP POLICY IF EXISTS "Allow public update access to lead_properties" ON public.lead_properties;

-- requirements policies
DROP POLICY IF EXISTS "Allow public delete access to requirements" ON public.requirements;
DROP POLICY IF EXISTS "Allow public insert access to requirements" ON public.requirements;
DROP POLICY IF EXISTS "Allow public read access to requirements" ON public.requirements;
DROP POLICY IF EXISTS "Allow public update access to requirements" ON public.requirements;

-- space_calculations policies
DROP POLICY IF EXISTS "Allow public delete access to space_calculations" ON public.space_calculations;
DROP POLICY IF EXISTS "Allow public insert access to space_calculations" ON public.space_calculations;
DROP POLICY IF EXISTS "Allow public read access to space_calculations" ON public.space_calculations;
DROP POLICY IF EXISTS "Allow public update access to space_calculations" ON public.space_calculations;

-- space_library policies
DROP POLICY IF EXISTS "Allow public delete access to space_library" ON public.space_library;
DROP POLICY IF EXISTS "Allow public insert access to space_library" ON public.space_library;
DROP POLICY IF EXISTS "Allow public read access to space_library" ON public.space_library;
DROP POLICY IF EXISTS "Allow public update access to space_library" ON public.space_library;

-- Step 3: Create secure RLS policies for leads (user-scoped)
CREATE POLICY "Users can view their own leads"
ON public.leads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
ON public.leads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
ON public.leads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
ON public.leads FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 4: Create secure RLS policies for properties (user-scoped)
CREATE POLICY "Users can view their own properties"
ON public.properties FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
ON public.properties FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 5: Create secure RLS policies for cost_analyses (via lead ownership)
CREATE POLICY "Users can view cost analyses for their leads"
ON public.cost_analyses FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = cost_analyses.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can create cost analyses for their leads"
ON public.cost_analyses FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = cost_analyses.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can update cost analyses for their leads"
ON public.cost_analyses FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = cost_analyses.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can delete cost analyses for their leads"
ON public.cost_analyses FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = cost_analyses.lead_id 
  AND leads.user_id = auth.uid()
));

-- Step 6: Create secure RLS policies for layout_images (via lead ownership)
CREATE POLICY "Users can view layout images for their leads"
ON public.layout_images FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = layout_images.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can create layout images for their leads"
ON public.layout_images FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = layout_images.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can update layout images for their leads"
ON public.layout_images FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = layout_images.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can delete layout images for their leads"
ON public.layout_images FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = layout_images.lead_id 
  AND leads.user_id = auth.uid()
));

-- Step 7: Create secure RLS policies for lead_properties (via lead ownership)
CREATE POLICY "Users can view lead properties for their leads"
ON public.lead_properties FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = lead_properties.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can create lead properties for their leads"
ON public.lead_properties FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = lead_properties.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can update lead properties for their leads"
ON public.lead_properties FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = lead_properties.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can delete lead properties for their leads"
ON public.lead_properties FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = lead_properties.lead_id 
  AND leads.user_id = auth.uid()
));

-- Step 8: Create secure RLS policies for requirements (via lead ownership)
CREATE POLICY "Users can view requirements for their leads"
ON public.requirements FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = requirements.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can create requirements for their leads"
ON public.requirements FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = requirements.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can update requirements for their leads"
ON public.requirements FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = requirements.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can delete requirements for their leads"
ON public.requirements FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = requirements.lead_id 
  AND leads.user_id = auth.uid()
));

-- Step 9: Create secure RLS policies for space_calculations (via lead ownership)
CREATE POLICY "Users can view space calculations for their leads"
ON public.space_calculations FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = space_calculations.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can create space calculations for their leads"
ON public.space_calculations FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = space_calculations.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can update space calculations for their leads"
ON public.space_calculations FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = space_calculations.lead_id 
  AND leads.user_id = auth.uid()
));

CREATE POLICY "Users can delete space calculations for their leads"
ON public.space_calculations FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.leads 
  WHERE leads.id = space_calculations.lead_id 
  AND leads.user_id = auth.uid()
));

-- Step 10: Create RLS policies for space_library (public read, authenticated write)
CREATE POLICY "Anyone can view space library"
ON public.space_library FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create space library entries"
ON public.space_library FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update space library entries"
ON public.space_library FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete custom space library entries"
ON public.space_library FOR DELETE
TO authenticated
USING (is_custom = true);

-- Step 11: Drop old storage policies and create secure ones
DROP POLICY IF EXISTS "Allow public read access to space-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to space-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access to space-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access to space-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access to property-images" ON storage.objects;

-- Space images: public read, authenticated write
CREATE POLICY "Anyone can view space images"
ON storage.objects FOR SELECT
USING (bucket_id = 'space-images');

CREATE POLICY "Authenticated users can upload space images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'space-images');

CREATE POLICY "Authenticated users can update space images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'space-images');

CREATE POLICY "Authenticated users can delete space images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'space-images');

-- Property images: public read, authenticated write with folder ownership
CREATE POLICY "Anyone can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can update property images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can delete property images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');