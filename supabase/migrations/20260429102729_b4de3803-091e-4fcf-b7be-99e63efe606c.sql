-- Roles system
CREATE TYPE public.app_role AS ENUM ('master_admin','admin','rep');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','master_admin')
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "anyone authenticated can read roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "master admin can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "master admin can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

CREATE POLICY "master admin can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'));

-- Auto-assign role on signup; harshrp2309@gmail.com -> master_admin, else rep
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'harshrp2309@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'master_admin')
      ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'rep')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Backfill existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master_admin'::public.app_role FROM auth.users WHERE email = 'harshrp2309@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'rep'::public.app_role
FROM auth.users u
WHERE u.email <> 'harshrp2309@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id)
ON CONFLICT DO NOTHING;

-- Tighten DELETE on leads & related to admin/master only
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
CREATE POLICY "Admins can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

DROP POLICY IF EXISTS "Users can delete activities for their leads" ON public.activities;
CREATE POLICY "Admins can delete activities"
  ON public.activities FOR DELETE
  TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

DROP POLICY IF EXISTS "Users delete contacts for their leads" ON public.lead_contacts;
CREATE POLICY "Admins can delete lead contacts"
  ON public.lead_contacts FOR DELETE
  TO authenticated
  USING (public.is_admin_or_master(auth.uid()));

DROP POLICY IF EXISTS "Users can delete lead properties for their leads" ON public.lead_properties;
CREATE POLICY "Admins can delete lead properties"
  ON public.lead_properties FOR DELETE
  TO authenticated
  USING (public.is_admin_or_master(auth.uid()));