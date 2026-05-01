import { useState } from "react";
import {
  Building2, UserPlus, Sparkles, X, Loader2, ExternalLink,
  ShieldCheck, ShieldAlert, Shield, Linkedin, Mail, Phone,
  ArrowUpRight, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { toast } from "sonner";
import type { BriefStructuredData, BriefSignal } from "@/hooks/useDailyBriefs";

interface BriefCompanyCardProps {
  itemKey: string;
  companyName: string;
  subtitle?: string;
  intentScore: number;
  remarks?: string;
  whyQualifies?: string;
  talkingPoints?: string[];
  structured?: BriefStructuredData;
  leadId?: string;
  onAddToLeads: () => Promise<unknown>;
  onEnrich: () => Promise<unknown>;
  onViewLead?: () => void;
  onNotRelevant: () => void;
}

export function BriefCompanyCard({
  itemKey,
  companyName,
  subtitle,
  intentScore,
  remarks,
  whyQualifies,
  talkingPoints,
  structured,
  leadId,
  onAddToLeads,
  onEnrich,
  onViewLead,
  onNotRelevant,
}: BriefCompanyCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleAction = async (action: "add" | "enrich") => {
    setLoading(action);
    try {
      if (action === "add") {
        await onAddToLeads();
        toast.success(`${companyName} added to leads`);
      } else {
        await onEnrich();
        toast.success(`${companyName} enriched and assigned`);
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setLoading(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onNotRelevant();
    toast.info(`${companyName} marked as not relevant`);
  };

  const readinessColor =
    intentScore >= 70 ? "text-emerald-500" :
    intentScore >= 50 ? "text-amber-500" :
    "text-red-500";

  const readinessBg =
    intentScore >= 70 ? "bg-emerald-500/10 border-emerald-500/20" :
    intentScore >= 50 ? "bg-amber-500/10 border-amber-500/20" :
    "bg-red-500/10 border-red-500/20";

  const domain = companyName.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "") + ".com";
  const logoUrl = `https://logo.clearbit.com/${domain}`;

  const topSignal = structured?.signals?.[0];

  return (
    <GlassCard variant="subtle" className="p-4 space-y-3">
      {/* Header: Logo + Name + Readiness Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoUrl}
            alt={companyName}
            className="h-10 w-10 rounded-lg bg-white/5 object-contain p-1"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold truncate">{companyName}</span>
            </div>
            {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className={`rounded-lg border px-3 py-1.5 text-center ${readinessBg}`}>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ready</div>
            <div className={`text-xl font-bold tabular-nums ${readinessColor}`}>{intentScore}</div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
            title="Not relevant"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Three Score Bars */}
      {structured && (
        <div className="grid grid-cols-3 gap-2">
          <MiniScore label="V" value={structured.verification_score} color="emerald" />
          <MiniScore label="I" value={structured.intent_score} color="amber" />
          <MiniScore label="C" value={structured.contactability_score} color="sky" />
        </div>
      )}

      {/* Top Verified Signal */}
      {topSignal && (
        <div className={`rounded-md border border-l-[3px] p-2.5 space-y-1.5 ${
          topSignal.verification_status === 'verified' ? 'border-l-emerald-500 bg-emerald-500/5' :
          topSignal.verification_status === 'partially_verified' ? 'border-l-amber-500 bg-amber-500/5' :
          'border-l-slate-400 bg-slate-500/5'
        }`}>
          <div className="flex items-center justify-between gap-2">
            <SignalTypeBadge type={topSignal.type} />
            <VerificationBadge status={topSignal.verification_status} />
          </div>
          {topSignal.claim && (
            <p className="text-xs leading-relaxed text-foreground">{topSignal.claim}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
            {topSignal.source_url ? (
              <a
                href={topSignal.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-sky-500 hover:underline"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                {topSignal.source_title || new URL(topSignal.source_url).hostname}
              </a>
            ) : topSignal.source_title ? (
              <span>{topSignal.source_title}</span>
            ) : null}
            {topSignal.published_date && <span>{topSignal.published_date}</span>}
            {topSignal.confidence !== null && topSignal.confidence !== undefined && (
              <span className={
                topSignal.confidence >= 80 ? 'text-emerald-500' :
                topSignal.confidence >= 50 ? 'text-amber-500' :
                'text-red-400'
              }>
                {topSignal.confidence >= 80 ? 'High' : topSignal.confidence >= 50 ? 'Medium' : 'Low'} confidence
              </span>
            )}
          </div>
        </div>
      )}

      {/* Contact Slate Mini */}
      {structured && structured.contact_count > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Slate</span>
          {structured.p1_count > 0 && (
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              {structured.p1_count} P1
            </span>
          )}
          {structured.p2_count > 0 && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              {structured.p2_count} P2
            </span>
          )}
          <DataPill icon={<Linkedin className="h-2.5 w-2.5" />} label="LinkedIn" count={structured.linkedin_count} />
          <DataPill icon={<Mail className="h-2.5 w-2.5" />} label="Email" count={structured.email_count} />
          <DataPill icon={<Phone className="h-2.5 w-2.5" />} label="Phone" count={structured.phone_count} />
        </div>
      )}

      {/* Why Qualifies */}
      {whyQualifies && (
        <div className="rounded-md bg-white/[0.03] p-2.5 space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Why this qualifies
          </div>
          <p className="text-xs">{whyQualifies}</p>
        </div>
      )}

      {/* Talking Points */}
      {talkingPoints && talkingPoints.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Talking points
          </div>
          <ul className="space-y-1">
            {talkingPoints.slice(0, 3).map((t, ti) => (
              <li key={ti} className="text-xs flex gap-2">
                <span className="text-primary">→</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outreach Ready Banner */}
      {structured && (
        <div className={`rounded-md border px-3 py-2 ${
          intentScore >= 70
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/30 dark:bg-emerald-900/15'
            : 'border-amber-200 bg-amber-50 dark:border-amber-800/30 dark:bg-amber-900/15'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${intentScore >= 70 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {intentScore >= 70 ? 'Outreach ready' : 'Enrichment in progress'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              V{structured.verification_score} · C{structured.contactability_score} · {structured.signals.filter(s => s.verification_status === 'verified').length} verified
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        {leadId && onViewLead && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-8"
            onClick={onViewLead}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Lead
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs h-8"
          disabled={loading !== null}
          onClick={() => handleAction("add")}
        >
          {loading === "add" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
          Add to Leads
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs h-8"
          disabled={loading !== null}
          onClick={() => handleAction("enrich")}
        >
          {loading === "enrich" ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          Enrich & Assign
        </Button>
      </div>
    </GlassCard>
  );
}

/* ─── Mini Score Bar ─── */
function MiniScore({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'sky' }) {
  const barColor = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', sky: 'bg-sky-500' }[color];
  const textColor = { emerald: 'text-emerald-600 dark:text-emerald-400', amber: 'text-amber-600 dark:text-amber-400', sky: 'text-sky-600 dark:text-sky-400' }[color];
  return (
    <div className="rounded border border-border bg-card/50 p-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">{label}</span>
        <span className={`text-xs font-bold tabular-nums ${textColor}`}>{value}</span>
      </div>
      <div className="mt-1 h-1 w-full rounded-full bg-secondary">
        <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

/* ─── Signal Type Badge ─── */
function SignalTypeBadge({ type }: { type?: string | null }) {
  const typeLabel = (type || 'signal').replace(/_/g, ' ');
  const typeColor =
    type === 'funding_round' || type === 'funding'
      ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
      : type === 'job_posting' || type === 'hiring'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : type === 'lease'
      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
      : type === 'office_expansion'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize ${typeColor}`}>
      {typeLabel}
    </span>
  );
}

/* ─── Verification Badge ─── */
function VerificationBadge({ status }: { status?: string | null }) {
  if (status === 'verified')
    return <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><ShieldCheck className="h-2.5 w-2.5" /> verified</span>;
  if (status === 'partially_verified')
    return <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"><ShieldAlert className="h-2.5 w-2.5" /> partial</span>;
  return <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"><Shield className="h-2.5 w-2.5" /> unverified</span>;
}

/* ─── Data Pill ─── */
function DataPill({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) {
  const present = count > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
      present
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
        : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500'
    }`}>
      {icon} {label} {present ? count : ''}
    </span>
  );
}
