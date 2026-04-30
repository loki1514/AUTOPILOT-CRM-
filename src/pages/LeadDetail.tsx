import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Linkedin, Phone, Mail, Sparkles, Building2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/atmosphere/PageHeader";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnrichLeadButton } from "@/components/crm/EnrichLeadButton";
import { useLead, useDeleteLead } from "@/hooks/useLeads";
import { useLeadContacts } from "@/hooks/useLeadContacts";
import { useActivities } from "@/hooks/useActivities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading } = useLead(id);
  const { data: contacts = [] } = useLeadContacts(id);
  const { data: activities = [] } = useActivities(id);
  const deleteLead = useDeleteLead();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8 text-muted-foreground animate-pulse">Loading…</div>
      </MainLayout>
    );
  }

  if (!lead) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Lead not found</p>
          <Button variant="ghost" onClick={() => navigate("/leads")} className="mt-4">
            Back to Leads
          </Button>
        </div>
      </MainLayout>
    );
  }

  async function handleDelete() {
    try {
      await deleteLead.mutateAsync(lead!.id);
      toast.success("Lead deleted");
      navigate("/leads");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const enriched = !!lead.enriched_at;
  const leadAny = lead as any;
  const status = leadAny.enrichment_status as string | undefined;
  const topContact = contacts[0];
  const headerTitle = topContact?.full_name || lead.full_name || lead.company;
  const headerEyebrow = topContact?.full_name
    ? `${lead.company} · ${lead.city || lead.location || "—"}`
    : `Lead · ${lead.city || lead.location || "—"}`;

  return (
    <MainLayout>
      <div className="flex items-center justify-between gap-3 mb-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <EnrichLeadButton leadId={lead.id} variant="outline" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes the lead and its enriched contacts.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <PageHeader
        eyebrow={headerEyebrow}
        title={headerTitle}
        subtitle={
          enriched
            ? `Enriched ${formatDistanceToNow(new Date(lead.enriched_at!), { addSuffix: true })} via ${leadAny.last_enriched_provider ?? "pipeline"}`
            : "Not yet enriched — run enrichment to pull decision-makers."
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard variant="strong" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-display text-xl">Decision Makers</h2>
            <Badge variant="secondary">{contacts.length}</Badge>
          </div>

          {contacts.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
              {status === "no_local_match" ? (
                <>
                  <p className="mt-3 text-sm font-medium">No local decision-maker found</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    {leadAny.enrichment_note ||
                      "Apollo has no Karnataka-based Ops / Facilities / Leadership profile for this company."}
                  </p>
                </>
              ) : status === "no_org_resolved" ? (
                <>
                  <p className="mt-3 text-sm font-medium">Company not in Apollo</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                    {leadAny.enrichment_note ||
                      "Add a website or domain to the lead and retry enrichment."}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No contacts yet. Run enrichment to pull leadership from Apollo.
                </p>
              )}
              <div className="mt-4 inline-block">
                <EnrichLeadButton leadId={lead.id} />
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                >
                  <Avatar className="h-10 w-10 ring-1 ring-white/10">
                    {c.photo_url && <AvatarImage src={c.photo_url} alt={c.full_name} />}
                    <AvatarFallback className="bg-white/5 text-[11px]">
                      {initials(c.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.title || "—"}
                      {c.seniority && c.seniority !== "unknown" && ` · ${c.seniority}`}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {c.linkedin_url && (
                        <a
                          href={c.linkedin_url.startsWith("http") ? c.linkedin_url : `https://${c.linkedin_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground tabular-nums"
                        >
                          <Phone className="h-3.5 w-3.5" /> {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Mail className="h-3.5 w-3.5" /> {c.email}
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard variant="strong">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-display text-xl">Intelligence</h2>
          </div>
          {leadAny.perplexity_summary ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {leadAny.perplexity_summary}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No company research yet. Enrichment will populate this with an OpenRouter research brief.
            </p>
          )}

          {lead.notes && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="eyebrow mb-2">From the brief</div>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{lead.notes}</p>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard variant="strong" className="mt-6">
        <h2 className="text-display text-xl mb-4">Activity</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity logged yet.</p>
        ) : (
          <ul className="space-y-3">
            {activities.map((a: any) => (
              <li key={a.id} className="flex gap-3 text-sm">
                <div className="text-xs text-muted-foreground w-24 shrink-0 tabular-nums">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </div>
                <div>
                  <span className="font-medium">{a.type}</span>
                  {a.content && <span className="text-muted-foreground"> · {a.content}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </MainLayout>
  );
}