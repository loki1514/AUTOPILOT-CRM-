import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntegrationStatus {
  id: string;
  user_id: string;
  provider: string;
  last_sync_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  total_calls_today: number;
  total_leads_ingested: number;
  credits_remaining: number | null;
  metadata: Record<string, unknown>;
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: ["integration-status"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_status")
        .select("*")
        .order("provider");
      if (error) throw error;
      return (data ?? []) as IntegrationStatus[];
    },
    refetchInterval: 30_000,
  });
}

export function useEnrichmentJobs(provider?: string, limit = 25) {
  return useQuery({
    queryKey: ["enrichment-jobs", provider ?? "all"],
    queryFn: async () => {
      let q = supabase.from("enrichment_jobs").select("*").order("created_at", { ascending: false }).limit(limit);
      if (provider) q = q.eq("provider", provider);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}