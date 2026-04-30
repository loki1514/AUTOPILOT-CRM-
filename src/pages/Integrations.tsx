import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GlassCard } from "@/components/atmosphere/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIntegrationStatus, useEnrichmentJobs, IntegrationStatus } from "@/hooks/useIntegrationStatus";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Activity, Zap, Search, Globe, Linkedin, Facebook, AlertTriangle, CheckCircle2, XCircle, Router } from "lucide-react";

const PROVIDERS = [
  { key: "apollo", name: "Apollo", icon: Zap, description: "B2B contact enrichment & decision-maker search", color: "#f59e0b" },
  { key: "perplexity", name: "OpenRouter Research", icon: Search, description: "AI research via OpenRouter with Perplexity/Sonar models", color: "#8b5cf6" },
  { key: "openrouter", name: "OpenRouter", icon: Router, description: "AI gateway for email drafts & content generation", color: "#ef4444" },
  { key: "scrapingbee", name: "ScrapingBee", icon: Globe, description: "Company website intelligence scraper", color: "#06b6d4" },
  { key: "meta", name: "Meta Lead Ads", icon: Facebook, description: "Facebook & Instagram lead form webhook", color: "#3b82f6" },
  { key: "linkedin", name: "LinkedIn Lead Gen", icon: Linkedin, description: "LinkedIn Lead Gen Forms webhook", color: "#0ea5e9" },
];

type HealthStatus = "healthy" | "warning" | "critical" | "unknown";

function getHealth(s?: IntegrationStatus): HealthStatus {
  if (!s || !s.last_success_at) return "unknown";
  const ageHours = (Date.now() - new Date(s.last_success_at).getTime()) / 36e5;
  if (s.last_error && ageHours < 1) return "critical";
  if (ageHours < 24) return "healthy";
  if (ageHours < 72) return "warning";
  return "critical";
}

function getCreditHealth(s?: IntegrationStatus): HealthStatus {
  if (!s || s.credits_remaining === null) return "unknown";
  if (s.credits_remaining <= 0) return "critical";
  if (s.credits_remaining < 500) return "warning";
  return "healthy";
}

function StatusDot({ status }: { status: HealthStatus }) {
  const colors = {
    healthy: "bg-emerald-500 shadow-[0_0_8px_rgba(34,211,122,0.5)]",
    warning: "bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    critical: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    unknown: "bg-muted-foreground",
  };
  return <span className={`h-2.5 w-2.5 rounded-full ${colors[status]}`} />;
}

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === "healthy") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "warning") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  if (status === "critical") return <XCircle className="h-4 w-4 text-red-400" />;
  return <Activity className="h-4 w-4 text-muted-foreground" />;
}

export default function Integrations() {
  const { data: statuses = [] } = useIntegrationStatus();
  const [testing, setTesting] = useState<string | null>(null);

  const byProvider = Object.fromEntries(statuses.map(s => [s.provider, s]));

  async function testConnection(provider: string) {
    setTesting(provider);
    try {
      const { data, error } = await supabase.functions.invoke("integration-test-connection", { body: { provider } });
      if (error) throw error;
      if (data?.ok) toast.success(`${provider}: ${data.message} (${data.latency_ms}ms)`);
      else toast.error(`${provider}: ${data?.message || "Failed"}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(null);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6 lg:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">Live status, credits, and health of all data sources.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROVIDERS.map(({ key, name, icon: Icon, description, color }) => {
            const s = byProvider[key];
            const health = getHealth(s);
            const creditHealth = getCreditHealth(s);
            const overallHealth = health === "critical" || creditHealth === "critical" ? "critical" :
              health === "warning" || creditHealth === "warning" ? "warning" : health;

            return (
              <GlassCard
                key={key}
                variant="subtle"
                className="relative overflow-hidden p-0"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ background: `${color}15`, color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-medium">{name}</h3>
                          <StatusDot status={overallHealth} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Credit / usage metrics */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <div className="text-muted-foreground">Calls today</div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">{s?.total_calls_today ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5">
                      <div className="text-muted-foreground">Leads enriched</div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">{s?.total_leads_ingested ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] p-2.5 col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Credits remaining</span>
                        {s?.credits_remaining !== null && s.credits_remaining < 500 && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Low
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-lg font-semibold tabular-nums">
                        {s?.credits_remaining ?? "—"}
                      </div>
                    </div>
                  </div>

                  {s?.last_error && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-300">
                      <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{s.last_error.slice(0, 120)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Last sync: {s?.last_sync_at ? formatDistanceToNow(new Date(s.last_sync_at), { addSuffix: true }) : "Never"}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={testing === key} onClick={() => testConnection(key)}>
                        {testing === key ? "Testing…" : "Test"}
                      </Button>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 px-2"><Activity className="h-3.5 w-3.5" /></Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-xl">
                          <SheetHeader><SheetTitle>{name} — recent jobs</SheetTitle></SheetHeader>
                          <JobsList provider={key} />
                        </SheetContent>
                      </Sheet>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}

function JobsList({ provider }: { provider: string }) {
  const { data: jobs = [], isLoading } = useEnrichmentJobs(provider);
  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading…</div>;
  if (!jobs.length) return <div className="text-sm text-muted-foreground p-4">No jobs yet.</div>;
  return (
    <div className="space-y-2 mt-4 max-h-[80vh] overflow-y-auto">
      {jobs.map((j: any) => (
        <div key={j.id} className="border border-white/5 rounded-lg p-3 text-xs space-y-1 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <Badge variant={j.status === "success" ? "default" : "destructive"}>{j.status}</Badge>
            <span className="text-muted-foreground">{formatDistanceToNow(new Date(j.created_at), { addSuffix: true })} · {j.latency_ms}ms</span>
          </div>
          {j.error && <div className="text-destructive">{j.error}</div>}
          {j.lead_id && <div className="text-muted-foreground font-mono">lead: {j.lead_id.slice(0, 8)}…</div>}
        </div>
      ))}
    </div>
  );
}
