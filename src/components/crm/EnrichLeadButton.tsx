import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function EnrichLeadButton({ leadId, variant = "default" }: { leadId: string; variant?: "default" | "outline" | "ghost" }) {
  const [running, setRunning] = useState(false);
  const qc = useQueryClient();

  async function run() {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-lead-pipeline", { body: { lead_id: leadId } });
      if (error) throw error;
      const summary = data?.summary || {};
      const p = summary.perplexity || {};
      const a = summary.apollo || {};
      const scores = summary.scores || null;
      const status: string | null = summary.status || null;
      const usedLabel = typeof a.credits_used === "number" ? `${a.credits_used} credits used` : "credits: —";
      const totalLabel = typeof a.credits_remaining === "number" ? `Net total: ${a.credits_remaining}` : "Net total: —";
      const pplxBit = p.ok
        ? (p.dm_found ? `Research: ${p.dm_name || "completed"}${p.dm_confidence ? ` (${p.dm_confidence})` : ""}` : "Research: completed")
        : "Research: failed";
      const apolloBit = a.ok
        ? `Apollo: ${a.contacts_upserted} contact${a.contacts_upserted === 1 ? "" : "s"}${a.path ? ` · ${a.path}` : ""}`
        : "Apollo: failed";
      const scoreBit = scores
        ? ` · V${scores.verification} I${scores.intent} C${scores.contactability} → ${scores.readiness}${status ? ` (${status.replace(/_/g, " ")})` : ""}`
        : "";
      const headline = `${apolloBit} · ${pplxBit} · ${usedLabel} · ${totalLabel}${scoreBit}`;

      if (a.contacts_upserted > 0) {
        toast.success(headline, {
          description: p.dm_found && p.dm_linkedin_url ? `LinkedIn: ${p.dm_linkedin_url}` : undefined,
        });
      } else if (a.reason === "no_org_resolved") {
        toast.warning(headline, { description: "Apollo couldn't resolve the company. Add a website or domain and retry." });
      } else if (p.dm_name) {
        toast.warning(headline, { description: `No Apollo match for "${p.dm_name}" — flagged for manual research.` });
      } else {
        toast.warning(headline, { description: "No local decision-maker found — flagged for manual research." });
      }
      if (!p.ok && p.error) {
        toast.error("Research failed", { description: String(p.error).slice(0, 200) });
      }
      if (!a.ok && a.error) {
        toast.error("Apollo failed", { description: String(a.error).slice(0, 200) });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["leads-with-contacts"] }),
        qc.invalidateQueries({ queryKey: ["leads"] }),
        qc.invalidateQueries({ queryKey: ["leads", leadId] }),
        qc.invalidateQueries({ queryKey: ["lead-contacts"] }),
        qc.invalidateQueries({ queryKey: ["lead-contacts", leadId] }),
        qc.invalidateQueries({ queryKey: ["intent-signals"] }),
        qc.invalidateQueries({ queryKey: ["enrichment-jobs"] }),
        qc.invalidateQueries({ queryKey: ["integration-status"] }),
      ]);
    } catch (e: any) {
      toast.error("Apollo enrichment failed", { description: e.message || "Unknown error" });
    } finally {
      setRunning(false);
    }
  }

  return (
    <Button onClick={run} disabled={running} variant={variant} size="sm" className="gap-2">
      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {running ? "Enriching…" : "Enrich Now"}
    </Button>
  );
}