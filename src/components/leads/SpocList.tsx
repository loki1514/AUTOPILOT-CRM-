import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Download, Mail, Phone, Linkedin, Sparkles, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { LeadWithContact } from "@/hooks/useLeadsWithContacts";
import { useBdReps } from "@/hooks/useBdReps";

interface SpocListProps {
  leads: LeadWithContact[];
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

function exportToCSV(leads: LeadWithContact[]) {
  const headers = ["Name", "Title", "Company", "Email", "Phone", "LinkedIn", "Key Signal", "Intent Score", "Rep"];
  const rows = leads.map((l) => {
    const c = l.top_contact;
    const signal = (l as any).intent_signals?.[0]?.signal_type || "";
    return [
      c?.full_name || l.full_name || "",
      c?.title || l.job_title || "",
      l.company || "",
      c?.email || l.email || "",
      c?.phone || l.phone || "",
      c?.linkedin_url || l.linkedin_url || "",
      signal,
      String((l as any).intent_score ?? ""),
      "",
    ];
  });

  const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spoc-list-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("SPOC list exported to CSV");
}

export function SpocList({ leads }: SpocListProps) {
  const { data: reps = [] } = useBdReps();

  const spocLeads = useMemo(() => {
    return leads.filter((l) => {
      const intentScore = (l as any).intent_score ?? 0;
      const status = (l as any).crm_status ?? "new";
      const enriched = !!l.enriched_at;
      return intentScore >= 65 && enriched && ["new", "contacted"].includes(status);
    });
  }, [leads]);

  if (spocLeads.length === 0) {
    return (
      <GlassCard variant="subtle" className="p-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          No outreach-ready contacts yet. Enrich leads to populate high-intent SPOCs.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">SPOC List</h3>
          <p className="text-xs text-muted-foreground">
            {spocLeads.length} contact{spocLeads.length === 1 ? "" : "s"} with intent score ≥ 65
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => exportToCSV(spocLeads)} className="gap-2">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <GlassCard variant="strong" hover={false} className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">LinkedIn</th>
                <th className="px-4 py-3 font-medium">Key Signal</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Rep</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {spocLeads.map((lead) => {
                const c = lead.top_contact;
                const displayName = c?.full_name || lead.full_name || "—";
                const title = c?.title || lead.job_title || "—";
                const email = c?.email || lead.email;
                const phone = c?.phone || lead.phone;
                const linkedin = c?.linkedin_url || lead.linkedin_url;
                const signal = (lead as any).intent_signals?.[0];
                const intentScore = (lead as any).intent_score ?? 0;
                const rep = reps.find((r) => r.id === lead.assigned_to);

                return (
                  <tr
                    key={lead.id}
                    className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">{displayName}</div>
                      <div className="text-xs text-muted-foreground">{title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{lead.company}</div>
                      <div className="text-xs text-muted-foreground">{lead.city || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          <span className="hidden sm:inline">{email}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          <span className="hidden sm:inline">{phone}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {linkedin ? (
                        <a
                          href={linkedin.startsWith("http") ? linkedin : `https://${linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline"
                        >
                          <Linkedin className="h-3 w-3" />
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {signal ? (
                        <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium capitalize">
                          {signal.signal_type?.replace(/_/g, " ") || "enriched"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold tabular-nums ${intentScore >= 70 ? "text-emerald-400" : intentScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {intentScore}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {rep?.member_name || "Unassigned"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
