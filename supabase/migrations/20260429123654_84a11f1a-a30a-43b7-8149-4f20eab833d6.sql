ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS enrichment_status text,
  ADD COLUMN IF NOT EXISTS enrichment_note text;

ALTER TABLE public.lead_contacts REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_contacts';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.leads';
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END$$;

DELETE FROM public.lead_contacts
WHERE full_name = 'Decision-maker (pending)'
   OR title ILIKE 'Leadership at %';