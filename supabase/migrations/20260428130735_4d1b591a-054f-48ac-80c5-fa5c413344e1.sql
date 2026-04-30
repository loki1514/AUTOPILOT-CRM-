REVOKE ALL ON FUNCTION public.seed_default_indicators(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_default_indicators(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.seed_default_indicators(uuid) TO authenticated;