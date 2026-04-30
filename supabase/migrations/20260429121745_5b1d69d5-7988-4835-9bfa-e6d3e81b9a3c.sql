INSERT INTO public.lead_contacts (lead_id, full_name, title, seniority, priority_rank, departments, enriched_at)
SELECT l.id,
       'Decision-maker (pending)',
       'Leadership at ' || l.company,
       'unknown',
       99,
       '{}'::text[],
       now()
FROM public.leads l
WHERE l.enriched_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.lead_contacts lc WHERE lc.lead_id = l.id);