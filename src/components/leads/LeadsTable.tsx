import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Linkedin, Phone, Mail, Building2, Search, Plus, Trash2, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadStatusPill, getLeadBucket, type LeadBucket } from "./LeadStatusPill";
import { BulkEnrichButton } from "./BulkEnrichButton";
import { EnrichLeadButton } from "@/components/crm/EnrichLeadButton";
import { useUserRole } from "@/hooks/useUserRole";
import { useBdReps } from "@/hooks/useBdReps";
import { useDeleteLead, useUpdateLead } from "@/hooks/useLeads";
import type { LeadWithContact } from "@/hooks/useLeadsWithContacts";
import { toast } from "sonner";

const FILTERS: { value: LeadBucket | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "cold", label: "Cold" },
  { value: "hot", label: "Hot" },
  { value: "future", label: "Future" },
];

type EnrichmentFilter =
  | "outreach_ready"
  | "manual_review"
  | "contacts_insufficient"
  | "needs_manual_research"
  | "archived";

const ENRICHMENT_FILTERS: { value: EnrichmentFilter; label: string; tone: string }[] = [
  { value: "outreach_ready",       label: "Outreach ready",       tone: "bg-emerald-500/20 text-emerald-200 ring-emerald-500/40" },
  { value: "manual_review",        label: "Manual review",        tone: "bg-amber-500/20 text-amber-200 ring-amber-500/40" },
  { value: "contacts_insufficient",label: "Contacts insufficient",tone: "bg-amber-500/15 text-amber-100 ring-amber-500/30" },
  { value: "needs_manual_research",label: "Needs manual research",tone: "bg-red-500/20 text-red-200 ring-red-500/40" },
  { value: "archived",             label: "Archived",             tone: "bg-white/10 text-muted-foreground ring-white/20" },
];

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export function LeadsTable({
  leads,
  onCreateNew,
}: {
  leads: LeadWithContact[];
  onCreateNew: () => void;
}) {
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState<LeadBucket | "all">("all");
  const [enrich, setEnrich] = useState<EnrichmentFilter | null>(null);
  const { canAssign, canDelete } = useUserRole();
  const { data: reps = [] } = useBdReps();
  const deleteLead = useDeleteLead();
  const updateLead = useUpdateLead();

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const name = (l.top_contact?.full_name || l.full_name || l.client_name || "").toLowerCase();
      const company = (l.company || "").toLowerCase();
      const matchesSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        company.includes(search.toLowerCase());
      const matchesBucket = bucket === "all" || getLeadBucket(l) === bucket;
      const matchesEnrich = !enrich || (l as any).enrichment_status === enrich;
      return matchesSearch && matchesBucket && matchesEnrich;
    });
  }, [leads, search, bucket, enrich]);

  async function handleAssign(leadId: string, repId: string | null) {
    try {
      await updateLead.mutateAsync({ id: leadId, assigned_to: repId } as any);
      toast.success("Assignment updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to assign");
    }
  }

  async function handleDelete(leadId: string) {
    if (!confirm("Delete this lead?")) return;
    try {
      await deleteLead.mutateAsync(leadId);
      toast.success("Lead deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search leads or companies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="glass-subtle inline-flex items-center gap-1 rounded-full p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setBucket(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  bucket === f.value
                    ? "bg-white/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-1">
            {ENRICHMENT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setEnrich(enrich === f.value ? null : f.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors inline-flex items-center gap-1 ring-1 ${
                  enrich === f.value ? f.tone : "ring-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                {f.value === "needs_manual_research" && <AlertCircle className="h-3 w-3" />}
                {f.label}
              </button>
            ))}
          </div>
          <BulkEnrichButton leads={leads} />
          <Button onClick={onCreateNew} size="sm" variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <GlassCard variant="strong" hover={false} className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <h3 className="mt-3 text-base font-medium">No leads match</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {leads.length === 0 ? "Create or import leads to get started." : "Try adjusting search or filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Lead</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const c = lead.top_contact;
                  const enriched = !!lead.enriched_at;
                  const status = (lead as any).enrichment_status as string | undefined;
                  let displayName: string;
                  let subtitle: string;
                  if (c?.full_name) {
                    displayName = c.full_name;
                    subtitle = c.title || (c.seniority && c.seniority !== "unknown" ? c.seniority : "Decision-maker");
                  } else if (lead.full_name) {
                    displayName = lead.full_name;
                    subtitle = lead.job_title || "Contact";
                  } else if ((lead as any).dm_name) {
                    displayName = (lead as any).dm_name as string;
                    subtitle = `${(lead as any).dm_title || "Decision-maker"} · researched, not in Apollo`;
                  } else if (status === "needs_manual_research" || status === "no_local_match") {
                    displayName = "No local decision-maker";
                    subtitle = `Flagged for manual research`;
                  } else if (status === "no_org_resolved") {
                    displayName = "Company not in Apollo";
                    subtitle = "Add a website or domain and retry";
                  } else if (!enriched) {
                    displayName = "Awaiting enrichment";
                    subtitle = `Click "Enrich Now" →`;
                  } else {
                    displayName = "Decision-maker not found";
                    subtitle = "Retry enrichment";
                  }
                  const linkedin = c?.linkedin_url || lead.linkedin_url;
                  const dmLinkedIn = (lead as any).dm_linkedin_url as string | undefined;
                  const linkedinHref = linkedin || dmLinkedIn;
                  const phone = c?.phone || lead.phone;
                  const email = c?.email || lead.email;
                  const researched = !!(lead as any).perplexity_summary;
                  return (
                    <tr
                      key={lead.id}
                      className="group border-b border-white/5 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 ring-1 ring-white/10">
                            {c?.photo_url && <AvatarImage src={c.photo_url} alt={displayName} />}
                            <AvatarFallback className="bg-white/5 text-[11px]">
                              {initials(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              to={`/leads/${lead.id}`}
                              className="block truncate font-medium hover:text-primary"
                            >
                              {displayName}
                            </Link>
                            <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{lead.company}</div>
                        <div className="text-xs text-muted-foreground">
                          {lead.city || lead.location || "—"}
                          {lead.contact_count > 1 && ` · +${lead.contact_count - 1} contacts`}
                          {researched && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              <Sparkles className="h-2.5 w-2.5" /> Researched
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {linkedinHref ? (
                            <a
                              href={linkedinHref.startsWith("http") ? linkedinHref : `https://${linkedinHref}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              title={linkedinHref}
                            >
                              <Linkedin className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="rounded p-1 text-muted-foreground/30"><Linkedin className="h-3.5 w-3.5" /></span>
                          )}
                          {phone ? (
                            <a
                              href={`tel:${phone}`}
                              className="flex items-center gap-1 rounded p-1 text-xs text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              title={phone}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              <span className="hidden lg:inline tabular-nums">{phone}</span>
                            </a>
                          ) : (
                            <span className="rounded p-1 text-muted-foreground/30"><Phone className="h-3.5 w-3.5" /></span>
                          )}
                          {email ? (
                            <a
                              href={`mailto:${email}`}
                              className="rounded p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                              title={email}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="rounded p-1 text-muted-foreground/30"><Mail className="h-3.5 w-3.5" /></span>
                          )}
                          {lead.contact_count === 0 && (
                            <span className="ml-2"><EnrichLeadButton leadId={lead.id} variant="ghost" /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <LeadStatusPill lead={lead} />
                        {typeof (lead as any).outreach_readiness === "number" && (lead as any).outreach_readiness > 0 && (
                          <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                            V{(lead as any).verification_score ?? 0} I{(lead as any).intent_score ?? 0} C{(lead as any).contactability_score ?? 0} → <span className="text-foreground">{(lead as any).outreach_readiness}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canAssign ? (
                          <Select
                            value={lead.assigned_to ?? "unassigned"}
                            onValueChange={(v) => handleAssign(lead.id, v === "unassigned" ? null : v)}
                          >
                            <SelectTrigger className="h-8 w-[150px] text-xs">
                              <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {reps.map((r) => (
                                <SelectItem key={r.id} value={r.user_id}>
                                  {r.member_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {reps.find((r) => r.user_id === lead.assigned_to)?.member_name ?? "Unassigned"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(lead.id)}
                              className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <Link
                            to={`/leads/${lead.id}`}
                            className="rounded p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}