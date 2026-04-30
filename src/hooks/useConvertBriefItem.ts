import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type BriefItemKind = "lease" | "funded" | "high_intent";

export interface ConvertBriefItemInput {
  kind: BriefItemKind;
  city: string;
  /** If the brief item already references a lead_id, use it directly */
  lead_id?: string;
  /** Lease / Funded / High Intent */
  company_name?: string;
  startup_name?: string;
  location?: string;
  seats?: string;
  lease_end?: string;
  funding?: string;
  team_size?: string;
  use_case?: string;
  intent_score?: number;
  /** If true, only creates the lead without running enrichment */
  skip_enrich?: boolean;
}

function parseHeadcount(seatsOrTeam?: string): number {
  if (!seatsOrTeam) return 10;
  const m = seatsOrTeam.match(/\d+/g);
  if (!m) return 10;
  const nums = m.map(Number);
  return Math.max(...nums) || 10;
}

export function useConvertBriefItem() {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ConvertBriefItemInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If brief item already has a lead_id reference, skip creation
      if (input.lead_id) {
        if (!input.skip_enrich) {
          const { data: enrich, error: enrichErr } = await supabase.functions.invoke(
            "enrich-lead-pipeline",
            { body: { lead_id: input.lead_id } },
          );
          if (enrichErr) throw enrichErr;
          return { leadId: input.lead_id, enrich, existing: true };
        }
        return { leadId: input.lead_id, enrich: null, existing: true };
      }

      const company =
        input.kind === "lease" ? input.company_name : input.startup_name;
      if (!company) throw new Error("Missing company name");

      // 1. Avoid duplicates — match on company + user
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("user_id", user.id)
        .ilike("company", company)
        .maybeSingle();

      let leadId = existing?.id as string | undefined;

      if (!leadId) {
        const notes =
          input.kind === "lease"
            ? `Lease ending ${input.lease_end ?? "?"} • ${input.location ?? ""} • ${input.seats ?? ""} seats`
            : input.kind === "funded"
            ? `Funded ${input.funding ?? ""} • ${input.team_size ?? ""} • ${input.use_case ?? ""}`
            : `High intent signal from Daily Briefs · ${input.city}`;

        const { data: newLead, error: insErr } = await supabase
          .from("leads")
          .insert({
            user_id: user.id,
            client_name: company,
            company,
            city: input.city,
            location: input.location ?? input.city,
            headcount: parseHeadcount(input.seats ?? input.team_size),
            source: "daily_brief",
            crm_status: "new",
            stage: "lead",
            intent_score: input.intent_score ?? 50,
            notes,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        leadId = newLead.id;
      }

      // 2. Run enrichment pipeline (Apollo + Perplexity + ScrapingBee)
      if (!input.skip_enrich) {
        const { data: enrich, error: enrichErr } = await supabase.functions.invoke(
          "enrich-lead-pipeline",
          { body: { lead_id: leadId } },
        );
        if (enrichErr) throw enrichErr;
        return { leadId, enrich, existing: false };
      }

      return { leadId, enrich: null, existing: false };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["leads-with-contacts"] });
      qc.invalidateQueries({ queryKey: ["lead-contacts"] });
      qc.invalidateQueries({ queryKey: ["intent-signals"] });
      toast({
        title: data.existing ? "Lead updated" : "Lead enriched",
        description: data.existing
          ? "Existing lead refreshed with latest enrichment data."
          : "Pushed to Leads with decision-makers populated.",
      });
    },
    onError: (e: Error) => {
      toast({
        title: "Enrichment failed",
        description: e.message,
        variant: "destructive",
      });
    },
  });
}
