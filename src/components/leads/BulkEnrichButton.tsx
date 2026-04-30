import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { LeadWithContact } from "@/hooks/useLeadsWithContacts";

/** Enriches every lead that has no Apollo contacts yet (or no enriched_at). */
export function BulkEnrichButton({ leads }: { leads: LeadWithContact[] }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const qc = useQueryClient();

  const targets = leads.filter((l) => l.contact_count === 0);

  async function run() {
    if (targets.length === 0) {
      toast.info("All leads are already enriched");
      return;
    }
    setRunning(true);
    setProgress({ done: 0, total: targets.length });
    let ok = 0;
    let fail = 0;
    // Run sequentially to stay within Apollo rate limits
    for (let i = 0; i < targets.length; i++) {
      try {
        const { data, error } = await supabase.functions.invoke("enrich-lead-pipeline", {
          body: { lead_id: targets[i].id },
        });
        if (error) throw error;
        const apolloOk = (data?.results?.apollo as any)?.data?.contacts_upserted > 0;
        if (apolloOk) ok++;
        else fail++;
      } catch {
        fail++;
      }
      setProgress({ done: i + 1, total: targets.length });
    }
    qc.invalidateQueries({ queryKey: ["leads-with-contacts"] });
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["integration-status"] });
    setRunning(false);
    toast.success(`Enriched ${ok}/${targets.length} leads (${fail} found no match)`);
  }

  return (
    <Button onClick={run} disabled={running} size="sm" className="gap-2">
      {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {running
        ? `Enriching ${progress.done}/${progress.total}…`
        : `Enrich ${targets.length} unenriched`}
    </Button>
  );
}