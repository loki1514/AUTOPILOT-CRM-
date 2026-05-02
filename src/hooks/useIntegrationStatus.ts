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

function normalizeIntegrationStatus(row: Partial<IntegrationStatus>): IntegrationStatus {
  return {
    id: row.id ?? row.provider ?? "unknown",
    user_id: row.user_id ?? "",
    provider: row.provider ?? "unknown",
    last_sync_at: row.last_sync_at ?? null,
    last_success_at: row.last_success_at ?? null,
    last_error: row.last_error ?? null,
    total_calls_today: row.total_calls_today ?? 0,
    total_leads_ingested: row.total_leads_ingested ?? 0,
    credits_remaining: row.credits_remaining ?? null,
    metadata: row.metadata ?? {},
  };
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
      return (data ?? []).map((row) => normalizeIntegrationStatus(row as Partial<IntegrationStatus>));
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