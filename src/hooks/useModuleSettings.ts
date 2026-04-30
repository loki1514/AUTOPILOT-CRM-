import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

export const ALL_MODULE_KEYS = [
  "pipeline",
  "deals",
  "crm",
  "signals",
  "indicators",
  "integrations",
  "leads",
  "properties",
  "campaigns",
  "outbox",
  "payroll",
  "intelligence",
  "briefs",
  "team",
  "tools.space",
  "tools.cost",
  "tools.brochure",
  "settings",
] as const;

export type ModuleKey = (typeof ALL_MODULE_KEYS)[number];

export const MODULE_META: Record<
  ModuleKey,
  { label: string; description: string; group: "main" | "tools" | "system" }
> = {
  pipeline: { label: "Pipeline (Home)", description: "Hello dashboard with KPI tiles.", group: "main" },
  deals: { label: "Deals", description: "Kanban deals board — the actual pipeline view.", group: "main" },
  crm: { label: "CRM", description: "Live leads and intent dashboard.", group: "main" },
  signals: { label: "Intent Signals", description: "Buying signals captured from enrichments.", group: "main" },
  indicators: { label: "Intent Indicators", description: "Configurable signal definitions.", group: "main" },
  integrations: { label: "Integrations", description: "Apollo, OpenRouter Research, ScrapingBee status & tests.", group: "main" },
  leads: { label: "Leads", description: "Enriched contact sheet.", group: "main" },
  properties: { label: "Properties", description: "Inventory of spaces.", group: "main" },
  campaigns: { label: "Email Campaigns", description: "Drafting and sending email campaigns.", group: "main" },
  outbox: { label: "Outbox", description: "Snapshot of sent emails and webhook statuses.", group: "main" },
  payroll: { label: "Payroll", description: "Payslip distribution module.", group: "main" },
  intelligence: { label: "Intelligence", description: "RSS / Drive sources & item feed.", group: "main" },
  briefs: { label: "Daily Briefs", description: "AI-generated city briefs.", group: "main" },
  team: { label: "BD Team", description: "Manage BD reps.", group: "main" },
  "tools.space": { label: "Space Calculator", description: "Quick fitout sizing tool.", group: "tools" },
  "tools.cost": { label: "Cost Analyzer", description: "Per-seat cost analysis.", group: "tools" },
  "tools.brochure": { label: "Brochure Generator", description: "Property brochure builder.", group: "tools" },
  settings: { label: "Settings", description: "This page (always available to authenticated users).", group: "system" },
};

const DEFAULT_ENABLED = new Set<ModuleKey>(ALL_MODULE_KEYS);

interface ModuleSettingsRow {
  key: string;
  enabled_modules: string[];
  updated_at: string;
}

export function useModuleSettings() {
  const qc = useQueryClient();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const query = useQuery({
    queryKey: ["module-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)("module_settings")
        .select("*")
        .eq("key", "global")
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ModuleSettingsRow | null;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`module-settings-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "module_settings" },
        () => qc.invalidateQueries({ queryKey: ["module-settings"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const enabled =
    query.data?.enabled_modules && Array.isArray(query.data.enabled_modules)
      ? new Set(query.data.enabled_modules as ModuleKey[])
      : DEFAULT_ENABLED;

  // Settings is always considered enabled regardless of stored value
  // so users can never lock themselves out of the toggle UI.
  enabled.add("settings");

  const setEnabled = useMutation({
    mutationFn: async (next: ModuleKey[]) => {
      if (!isAdmin) {
        throw new Error("Only admins can change module settings");
      }
      const list = Array.from(new Set([...next, "settings"]));
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from as any)("module_settings")
        .upsert(
          {
            key: "global",
            enabled_modules: list,
            updated_at: new Date().toISOString(),
            updated_by: user?.id ?? null,
          },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-settings"] });
      toast.success("Module settings updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function isEnabled(key: ModuleKey): boolean {
    return enabled.has(key);
  }

  function toggle(key: ModuleKey, on: boolean) {
    if (!isAdmin) {
      toast.error("Only admins can toggle modules");
      return;
    }
    const next = new Set(enabled);
    if (on) next.add(key);
    else next.delete(key);
    setEnabled.mutate(Array.from(next));
  }

  return {
    isLoading: query.isLoading || roleLoading,
    enabled,
    isEnabled,
    toggle,
    setEnabled,
    canToggle: isAdmin,
  };
}
