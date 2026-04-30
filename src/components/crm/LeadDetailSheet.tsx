import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sparkles, Search, Phone, Mail, StickyNote, CalendarDays,
  ExternalLink, ShieldCheck, ShieldAlert, Shield, XCircle,
  Linkedin, ArrowUpRight, Loader2
} from 'lucide-react';
import { formatDistanceToNowStrict, format } from 'date-fns';
import type { Lead, ActivityType, BdRep, IntentSignal, LeadContact, DisqualifiedClaim } from '@/types';
import { useUpdateLeadFields, useAssignLead } from '@/hooks/useCrmLeads';
import { useActivities, useAddActivity } from '@/hooks/useActivities';
import { useIntentSignals } from '@/hooks/useIntentSignals';
import { useLeadContacts } from '@/hooks/useLeadContacts';
import { useUserRole } from '@/hooks/useUserRole';
import { useEnrichLead } from '@/hooks/useEnrichLead';
import { SourceIcon } from './SourceIcon';
import { toast } from 'sonner';

interface LeadDetailSheetProps {
  lead: Lead | null;
  reps: BdRep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialActivity?: ActivityType | null;
}

export function LeadDetailSheet({
  lead,
  reps,
  open,
  onOpenChange,
  initialActivity,
}: LeadDetailSheetProps) {
  const [tab, setTab] = useState('contact');
  const [draft, setDraft] = useState<Partial<Lead>>({});
  const [activityType, setActivityType] = useState<ActivityType>('note');
  const [activityContent, setActivityContent] = useState('');

  const updateFields = useUpdateLeadFields();
  const assign = useAssignLead();
  const addActivity = useAddActivity();
  const { canAssign } = useUserRole();
  const { data: activities = [] } = useActivities(lead?.id);
  const { data: signals = [] } = useIntentSignals(lead?.id);
  const { data: contacts = [] } = useLeadContacts(lead?.id);
  const enrich = useEnrichLead();

  useEffect(() => {
    if (lead) {
      setDraft({});
      if (initialActivity) {
        setTab('activity');
        setActivityType(initialActivity);
      } else {
        setTab('contact');
      }
    }
  }, [lead, initialActivity]);

  if (!lead) return null;

  const merged: Lead = { ...lead, ...draft } as Lead;

  const saveContact = async () => {
    if (Object.keys(draft).length === 0) {
      toast.info('No changes');
      return;
    }
    try {
      await updateFields.mutateAsync({ id: lead.id, ...draft });
      toast.success('Lead updated');
      setDraft({});
    } catch (e: any) {
      toast.error(e.message ?? 'Update failed');
    }
  };

  const submitActivity = async () => {
    if (!activityContent.trim()) {
      toast.error('Add some content');
      return;
    }
    try {
      await addActivity.mutateAsync({
        lead_id: lead.id,
        type: activityType,
        content: activityContent.trim(),
      });
      setActivityContent('');
      toast.success('Activity logged');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed');
    }
  };

  const handleAssign = async (repId: string) => {
    const repName = reps.find((r) => r.id === repId)?.member_name;
    try {
      await assign.mutateAsync({
        leadId: lead.id,
        repId: repId === 'unassigned' ? null : repId,
        repName,
      });
      toast.success('Assignment updated');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed');
    }
  };

  const handleEnrich = async (provider: 'apollo' | 'perplexity') => {
    try {
      await enrich.mutateAsync({ leadId: lead.id, provider });
      toast.success(`${provider === 'apollo' ? 'Apollo' : 'Research'} enrichment started`);
    } catch (e: any) {
      toast.error(e.message ?? 'Enrichment failed');
    }
  };

  const f = (key: keyof Lead) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value || null }));

  const verifiedSignals = signals.filter((s) => s.verification_status === 'verified' || s.verification_status === 'partially_verified');
  const discardedSignals: DisqualifiedClaim[] = Array.isArray(lead.disqualified_claims) ? lead.disqualified_claims : [];
  const p1Contacts = contacts.filter((c) => c.priority_rank <= 2);
  const p2Contacts = contacts.filter((c) => c.priority_rank > 2 && c.priority_rank <= 5);
  const emptySlots = Math.max(0, 4 - contacts.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0" data-crm>
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <SourceIcon source={lead.source} />
              <div>
                <SheetTitle className="text-left text-xl font-semibold leading-tight">
                  {merged.full_name || merged.client_name}
                </SheetTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {merged.job_title}{merged.job_title && merged.company && ' · '}{merged.company}{merged.company && merged.city && ' · '}{merged.city}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Outreach readiness</div>
              <div className={`text-3xl font-bold tabular-nums ${(lead.outreach_readiness ?? 0) >= 70 ? 'text-emerald-500' : (lead.outreach_readiness ?? 0) >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                {lead.outreach_readiness ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="intent">Intent</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="assignment">Assign</TabsTrigger>
              <TabsTrigger value="enrich">Enrich</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Full name" value={merged.full_name ?? ''} onChange={f('full_name')} />
                <Field label="Client name" value={merged.client_name ?? ''} onChange={f('client_name')} />
                <Field label="Email" value={merged.email ?? ''} onChange={f('email')} />
                <Field label="Phone" value={merged.phone ?? ''} onChange={f('phone')} />
                <Field label="Company" value={merged.company ?? ''} onChange={f('company')} />
                <Field label="Job title" value={merged.job_title ?? ''} onChange={f('job_title')} />
                <Field label="LinkedIn URL" value={merged.linkedin_url ?? ''} onChange={f('linkedin_url')} />
                <Field label="Company size" value={merged.company_size ?? ''} onChange={f('company_size')} />
                <Field label="City" value={merged.city ?? ''} onChange={f('city')} />
                <Field label="Office size needed" value={merged.office_size_needed ?? ''} onChange={f('office_size_needed')} />
                <Field label="Move-in date" type="date" value={merged.move_in_date ?? ''} onChange={f('move_in_date')} />
                <Field label="Budget (monthly)" type="number" value={String(merged.budget_monthly ?? '')} onChange={(e) => setDraft((d) => ({ ...d, budget_monthly: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <Button onClick={saveContact} disabled={updateFields.isPending} className="w-full">
                {updateFields.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </TabsContent>

            <TabsContent value="intent" className="space-y-5 pt-4">
              {/* Three Score Cards */}
              <div className="grid grid-cols-3 gap-3">
                <ScoreCard label="VERIFICATION" value={lead.verification_score ?? 0} color="emerald" />
                <ScoreCard label="INTENT" value={lead.intent_score ?? 0} color="amber" />
                <ScoreCard label="CONTACTABILITY" value={lead.contactability_score ?? 0} color="sky" />
              </div>

              {/* Verified Signals */}
              <section>
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Verified Signals
                </h4>
                {verifiedSignals.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No verified signals yet. Run Enrich to populate.</p>
                ) : (
                  <div className="space-y-2.5">
                    {verifiedSignals.map((s) => (
                      <SignalCard key={s.id} signal={s} />
                    ))}
                  </div>
                )}
              </section>

              {/* Discarded Signals */}
              {discardedSignals.length > 0 && (
                <section>
                  <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Discarded Signals
                  </h4>
                  <div className="space-y-2">
                    {discardedSignals.map((d, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded border border-dashed border-border bg-card/40 p-3">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                        <div className="space-y-0.5">
                          <p className="text-sm text-muted-foreground line-through">{d.claim}</p>
                          <p className="text-xs text-muted-foreground/70">{d.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Contact Slate */}
              <section>
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact Slate — {contacts.length} Found
                </h4>
                {contacts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No contacts enriched yet. Use Enrich tab to find decision makers.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {contacts.map((c) => (
                      <ContactCard key={c.id} contact={c} />
                    ))}
                    {emptySlots > 0 && (
                      <button
                        onClick={() => setTab('enrich')}
                        className="flex h-full min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border bg-card/30 text-sm text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
                      >
                        + enrich {emptySlots} more slot{emptySlots > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                )}
              </section>

              {/* Outreach Ready Banner */}
              <OutreachBanner lead={lead} contacts={contacts} verifiedCount={verifiedSignals.filter((s) => s.verification_status === 'verified').length} />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 pt-4">
              <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note"><StickyNote className="mr-2 inline h-3 w-3" />Note</SelectItem>
                      <SelectItem value="call"><Phone className="mr-2 inline h-3 w-3" />Call</SelectItem>
                      <SelectItem value="email"><Mail className="mr-2 inline h-3 w-3" />Email</SelectItem>
                      <SelectItem value="meeting"><CalendarDays className="mr-2 inline h-3 w-3" />Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={submitActivity} disabled={addActivity.isPending} size="sm">
                    {addActivity.isPending ? 'Logging…' : 'Log'}
                  </Button>
                </div>
                <Textarea
                  placeholder="What happened?"
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  rows={3}
                />
              </div>

              <ul className="space-y-2">
                {activities.length === 0 && (
                  <p className="text-xs text-muted-foreground">No activity yet.</p>
                )}
                {activities.map((a) => (
                  <li key={a.id} className="rounded border border-border bg-card p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{a.type.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">
                        {format(new Date(a.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    {a.content && <p className="mt-1 text-muted-foreground">{a.content}</p>}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="assignment" className="space-y-3 pt-4">
              {canAssign ? (
                <>
                  <p className="text-xs text-muted-foreground">Pick a BD rep. Workload shown live.</p>
                  <Select
                    value={lead.assigned_to ?? 'unassigned'}
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {reps.map((r) => {
                        const load = r.active_leads_count ?? 0;
                        const pct = (load / r.max_leads) * 100;
                        return (
                          <SelectItem key={r.id} value={r.id}>
                            {r.member_name} · {load}/{r.max_leads}
                            {pct > 80 && ' ⚠'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-muted-foreground">
                  <div className="mb-1 text-foreground/70">Assigned to</div>
                  <div>
                    {reps.find((r) => r.id === lead.assigned_to)?.member_name ?? 'Unassigned'}
                  </div>
                  <p className="mt-2 text-[11px] text-foreground/45">
                    Only admins can reassign leads.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="enrich" className="space-y-3 pt-4">
              <Button
                onClick={() => handleEnrich('apollo')}
                disabled={enrich.isPending}
                className="w-full"
              >
                {enrich.isPending && enrich.variables?.provider === 'apollo' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Enrich with Apollo
              </Button>
              <Button
                onClick={() => handleEnrich('perplexity')}
                disabled={enrich.isPending}
                variant="secondary"
                className="w-full"
              >
                {enrich.isPending && enrich.variables?.provider === 'perplexity' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Research with OpenRouter
              </Button>
              <p className="text-xs text-muted-foreground">
                Apollo enriches contact data (emails, phones, titles). OpenRouter researches company signals via Perplexity/Sonar (funding, hiring, expansion).
                Results appear in the Intent tab within 30–60 seconds.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Score Card ─── */
function ScoreCard({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'sky' }) {
  const barColor = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    sky: 'bg-sky-500',
  }[color];
  const textColor = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    sky: 'text-sky-600 dark:text-sky-400',
  }[color];

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${textColor}`}>
        {value}
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-secondary">
        <div className={`h-1 rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

/* ─── Signal Card ─── */
function SignalCard({ signal }: { signal: IntentSignal }) {
  const borderColor =
    signal.verification_status === 'verified'
      ? 'border-l-emerald-500'
      : signal.verification_status === 'partially_verified'
      ? 'border-l-amber-500'
      : signal.verification_status === 'conflicting'
      ? 'border-l-red-500'
      : 'border-l-slate-400';

  const typeLabel = (signal.signal_type || 'signal').replace(/_/g, ' ');
  const typeColor =
    signal.signal_type === 'funding_round'
      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
      : signal.signal_type === 'job_posting'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : signal.signal_type === 'headcount_growth'
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
      : signal.signal_type === 'linkedin_activity'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className={`rounded-lg border border-border border-l-[3px] ${borderColor} bg-card p-3.5 space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${typeColor}`}>
          {typeLabel}
        </span>
        <VerificationBadge status={signal.verification_status} />
      </div>

      {(signal.claim || signal.signal_value) && (
        <p className="text-sm leading-relaxed text-foreground">{signal.claim || signal.signal_value}</p>
      )}

      {signal.why_it_matters && (
        <p className="text-xs italic text-muted-foreground">{signal.why_it_matters}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {signal.source_url ? (
          <a
            href={signal.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
          >
            <ExternalLink className="h-3 w-3" />
            {signal.source_title || new URL(signal.source_url).hostname}
          </a>
        ) : signal.source_title ? (
          <span>{signal.source_title}</span>
        ) : (
          <span className="capitalize">{signal.source_api}</span>
        )}
        {signal.published_date && (
          <span>{format(new Date(signal.published_date), 'dd MMM yyyy')}</span>
        )}
        {signal.detected_at && !signal.published_date && (
          <span>{formatDistanceToNowStrict(new Date(signal.detected_at), { addSuffix: true })}</span>
        )}
        {signal.confidence !== null && signal.confidence !== undefined && (
          <span className={
            signal.confidence >= 80 ? 'text-emerald-600 dark:text-emerald-400'
            : signal.confidence >= 50 ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-500'
          }>
            {signal.confidence >= 80 ? 'High confidence' : signal.confidence >= 50 ? 'Medium confidence' : 'Low confidence'}
            {signal.verification_status === 'partially_verified' && ' — 1 source'}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Verification Badge ─── */
function VerificationBadge({ status }: { status?: string | null }) {
  if (status === 'verified')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        <ShieldCheck className="h-3 w-3" /> verified
      </span>
    );
  if (status === 'partially_verified')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <ShieldAlert className="h-3 w-3" /> partially verified
      </span>
    );
  if (status === 'conflicting')
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <XCircle className="h-3 w-3" /> conflicting
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      <Shield className="h-3 w-3" /> unverified
    </span>
  );
}

/* ─── Contact Card ─── */
function ContactCard({ contact }: { contact: LeadContact }) {
  const isP1 = contact.priority_rank <= 2;
  const hasLinkedIn = !!contact.linkedin_url;
  const hasEmail = !!contact.email;
  const hasPhone = !!contact.phone;

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-foreground">{contact.full_name}</div>
          {contact.title && <div className="text-xs text-muted-foreground">{contact.title}</div>}
        </div>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${isP1 ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
          {isP1 ? 'P1' : 'P2'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <DataPill label="LinkedIn" present={hasLinkedIn} icon={<Linkedin className="h-3 w-3" />} />
        <DataPill label="Email" present={hasEmail} icon={<Mail className="h-3 w-3" />} />
        <DataPill label="Phone" present={hasPhone} icon={<Phone className="h-3 w-3" />} />
      </div>
    </div>
  );
}

function DataPill({ label, present, icon }: { label: string; present: boolean; icon: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
      present
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
        : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500'
    }`}>
      {icon} {label}
    </span>
  );
}

/* ─── Outreach Banner ─── */
function OutreachBanner({ lead, contacts, verifiedCount }: { lead: Lead; contacts: LeadContact[]; verifiedCount: number }) {
  const ready = (lead.outreach_readiness ?? 0) >= 70;
  const p1Count = contacts.filter((c) => c.priority_rank <= 2).length;

  return (
    <div className={`rounded-lg border p-4 ${
      ready
        ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-900/20'
        : 'border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className={`text-sm font-semibold ${ready ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
            {ready ? 'Outreach ready' : 'Not outreach ready'}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Verification {lead.verification_score ?? 0} · Contactability {lead.contactability_score ?? 0} · {verifiedCount} verified signal{verifiedCount !== 1 ? 's' : ''}
            {p1Count > 0 && ` · ${p1Count} P1 contact${p1Count !== 1 ? 's' : ''}`}
          </div>
        </div>
        <Button
          variant={ready ? 'default' : 'outline'}
          size="sm"
          className={`shrink-0 gap-1 ${ready ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
          disabled={!ready}
          onClick={() => toast.info('Draft outreach — coming in Phase 3')}
        >
          Draft outreach <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ─── Form Field ─── */
function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={onChange} type={type} />
    </div>
  );
}
