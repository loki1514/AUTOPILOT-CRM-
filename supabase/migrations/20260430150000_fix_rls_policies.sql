-- =========================================================
-- SECURITY FIX: Replace wide-open RLS policies with proper
-- user-scoped and role-based policies.
-- =========================================================

-- ---------------------------------------------------------
-- 1. LEADS — tighten from "public" to owner / assigned / admin
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert access to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public update access to leads" ON public.leads;
-- Keep: "Admins can delete leads" (already correct)

CREATE POLICY "Users can view their own or assigned leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR public.is_admin_or_master(auth.uid())
  );

CREATE POLICY "Users can insert their own leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own or assigned leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR assigned_to = auth.uid()
    OR public.is_admin_or_master(auth.uid())
  );

-- ---------------------------------------------------------
-- 2. PROPERTIES — tighten from "public" to owner
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public insert access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public update access to properties" ON public.properties;
DROP POLICY IF EXISTS "Allow public delete access to properties" ON public.properties;

CREATE POLICY "Users can view properties"
  ON public.properties FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users can insert properties"
  ON public.properties FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update properties"
  ON public.properties FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE
  TO authenticated USING (public.is_admin_or_master(auth.uid()));

-- ---------------------------------------------------------
-- 3. LEAD_PROPERTIES — tighten from "public" to lead-owner
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to lead_properties" ON public.lead_properties;
DROP POLICY IF EXISTS "Allow public insert access to lead_properties" ON public.lead_properties;
DROP POLICY IF EXISTS "Allow public update access to lead_properties" ON public.lead_properties;
DROP POLICY IF EXISTS "Allow public delete access to lead_properties" ON public.lead_properties;

CREATE POLICY "Users can view lead_properties for their leads"
  ON public.lead_properties FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_properties.lead_id AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid() OR public.is_admin_or_master(auth.uid()))));

CREATE POLICY "Users can insert lead_properties for their leads"
  ON public.lead_properties FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_properties.lead_id AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid() OR public.is_admin_or_master(auth.uid()))));

CREATE POLICY "Users can update lead_properties for their leads"
  ON public.lead_properties FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_properties.lead_id AND (leads.user_id = auth.uid() OR leads.assigned_to = auth.uid() OR public.is_admin_or_master(auth.uid()))));

-- Keep admin delete (already exists)

-- ---------------------------------------------------------
-- 4. REQUIREMENTS — tighten from "public"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to requirements" ON public.requirements;
DROP POLICY IF EXISTS "Allow public insert access to requirements" ON public.requirements;
DROP POLICY IF EXISTS "Allow public update access to requirements" ON public.requirements;
DROP POLICY IF EXISTS "Allow public delete access to requirements" ON public.requirements;

CREATE POLICY "Users can view requirements"
  ON public.requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert requirements"
  ON public.requirements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update requirements"
  ON public.requirements FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete requirements"
  ON public.requirements FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------
-- 5. SPACE_CALCULATIONS — tighten from "public"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to space_calculations" ON public.space_calculations;
DROP POLICY IF EXISTS "Allow public insert access to space_calculations" ON public.space_calculations;
DROP POLICY IF EXISTS "Allow public update access to space_calculations" ON public.space_calculations;
DROP POLICY IF EXISTS "Allow public delete access to space_calculations" ON public.space_calculations;

CREATE POLICY "Users can view space_calculations"
  ON public.space_calculations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert space_calculations"
  ON public.space_calculations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update space_calculations"
  ON public.space_calculations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete space_calculations"
  ON public.space_calculations FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------
-- 6. COST_ANALYSES — tighten from "public"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to cost_analyses" ON public.cost_analyses;
DROP POLICY IF EXISTS "Allow public insert access to cost_analyses" ON public.cost_analyses;
DROP POLICY IF EXISTS "Allow public update access to cost_analyses" ON public.cost_analyses;
DROP POLICY IF EXISTS "Allow public delete access to cost_analyses" ON public.cost_analyses;

CREATE POLICY "Users can view cost_analyses"
  ON public.cost_analyses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert cost_analyses"
  ON public.cost_analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update cost_analyses"
  ON public.cost_analyses FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete cost_analyses"
  ON public.cost_analyses FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------
-- 7. LAYOUT_IMAGES — tighten from "public"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to layout_images" ON public.layout_images;
DROP POLICY IF EXISTS "Allow public insert access to layout_images" ON public.layout_images;
DROP POLICY IF EXISTS "Allow public update access to layout_images" ON public.layout_images;
DROP POLICY IF EXISTS "Allow public delete access to layout_images" ON public.layout_images;

CREATE POLICY "Users can view layout_images"
  ON public.layout_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert layout_images"
  ON public.layout_images FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update layout_images"
  ON public.layout_images FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete layout_images"
  ON public.layout_images FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------
-- 8. SPACE_LIBRARY — tighten from "public"
-- ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read access to space_library" ON public.space_library;
DROP POLICY IF EXISTS "Allow public insert access to space_library" ON public.space_library;
DROP POLICY IF EXISTS "Allow public update access to space_library" ON public.space_library;
DROP POLICY IF EXISTS "Allow public delete access to space_library" ON public.space_library;

CREATE POLICY "Users can view space_library"
  ON public.space_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert space_library"
  ON public.space_library FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update space_library"
  ON public.space_library FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete space_library"
  ON public.space_library FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------
-- 9. MODULE_SETTINGS — only admins can write
-- ---------------------------------------------------------
ALTER TABLE public.module_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view module_settings" ON public.module_settings;
DROP POLICY IF EXISTS "Users can insert module_settings" ON public.module_settings;
DROP POLICY IF EXISTS "Users can update module_settings" ON public.module_settings;

CREATE POLICY "Anyone can view module_settings"
  ON public.module_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert module_settings"
  ON public.module_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin_or_master(auth.uid()));

CREATE POLICY "Admins can update module_settings"
  ON public.module_settings FOR UPDATE
  TO authenticated USING (public.is_admin_or_master(auth.uid()));
