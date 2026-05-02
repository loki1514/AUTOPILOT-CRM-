import { forwardRef, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  TrendingUp,
  ShieldAlert,
  MapPin,
  Lightbulb,
  Download,
  Sparkles,
  Users,
  Building2,
  RefreshCw,
  Loader2,
  Filter,
  CheckCircle,
} from "lucide-react";
import { useDailyBriefs, type DailyBrief } from "@/hooks/useDailyBriefs";
import { useConvertBriefItem } from "@/hooks/useConvertBriefItem";
import { exportBriefToPdf } from "@/lib/briefPdf";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeRangeToggle, type TimeRange } from "@/components/common/TimeRangeToggle";
import { BriefCompanyCard } from "./BriefCompanyCard";

const CITIES = ["Bangalore", "Mumbai", "Delhi NCR", "Noida"];

export function DailyPulseView() {
  const [city, setCity] = useState(CITIES[0]);
  const [range, setRange] = useState<TimeRange>("today");
  const { briefs, isLoading, generateBrief } = useDailyBriefs(city);

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (range === "today") return startOfDay(now);
    if (range === "week") return startOfWeek(now, { weekStartsOn: 1 });
    return startOfMonth(now);
  }, [range]);

  const briefsInRange = useMemo(
    () => briefs.filter((b) => new Date(b.brief_date).getTime() >= rangeStart.getTime()),
    [briefs, rangeStart],
  );

  const latest = briefsInRange[0] || briefs[0];

  return (
    <div className="space-y-6">
      <Tabs value={city} onValueChange={setCity}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <TabsList>
              {CITIES.map((c) => (
                <TabsTrigger key={c} value={c}>
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
            <TimeRangeToggle value={range} onChange={setRange} />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateBrief.mutate({ city })}
              disabled={generateBrief.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${generateBrief.isPending ? "animate-spin" : ""}`}
              />
              {generateBrief.isPending ? "Generating…" : "Generate today's brief"}
            </Button>
            {latest && (
              <Button size="sm" onClick={() => exportBriefToPdf(latest)}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        {CITIES.map((c) => (
          <TabsContent key={c} value={c} className="mt-6">
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : !latest ? (
              <EmptyState onGenerate={() => generateBrief.mutate({ city: c })} pending={generateBrief.isPending} />
            ) : (
              <BriefBody brief={latest} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function EmptyState({ onGenerate, pending }: { onGenerate: () => void; pending: boolean }) {
  return (
    <Card>
      <CardContent className="py-16 text-center space-y-4">
        <Sparkles className="h-10 w-10 mx-auto text-muted-foreground" />
        <div>
          <h3 className="font-semibold text-lg">No enriched leads in this city</h3>
          <p className="text-muted-foreground text-sm">
            Add leads and run Enrich to populate real evidence-backed signals. Daily Briefs aggregate only enriched leads with verified data.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={pending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${pending ? "animate-spin" : ""}`} />
          {pending ? "Checking…" : "Generate brief from enriched leads"}
        </Button>
      </CardContent>
    </Card>
  );
}

function BriefBody({ brief }: { brief: DailyBrief }) {
  const convert = useConvertBriefItem();
  const navigate = useNavigate();
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filterItem = (item: { _structured?: { signals?: Array<{ verification_status?: string | null }> } }) => {
    if (!verifiedOnly) return true;
    return item._structured?.signals?.some((s) => s.verification_status === 'verified') ?? false;
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-7">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground mb-2 tracking-[0.14em] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                DAILY PULSE · {brief.city.toUpperCase()} ·{" "}
                {new Date(brief.brief_date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <h2 className="text-display text-3xl leading-tight">{brief.headline}</h2>
            </div>
            <Button
              size="sm"
              variant={verifiedOnly ? "default" : "outline"}
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className="shrink-0 gap-1.5"
            >
              {verifiedOnly ? <CheckCircle className="h-3.5 w-3.5" /> : <Filter className="h-3.5 w-3.5" />}
              {verifiedOnly ? "Verified only" : "All signals"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              {brief.expiring_leases?.length || 0} leases
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {brief.funded_startups?.length || 0} funded
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {brief.high_intent?.length || 0} high intent
            </Badge>
            {brief.enriched_at && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Enriched {new Date(brief.enriched_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 1. Expiring leases */}
      <Section icon={<CalendarClock className="h-4 w-4" />} label={`1. Leases Expiring · ${brief.expiring_leases?.filter(filterItem).length || 0} found`} tone="success">
        <div className="grid gap-3 md:grid-cols-2">
          {brief.expiring_leases?.filter(filterItem).map((l, i) => (
            <BriefCompanyCard
              key={`lease-${i}`}
              itemKey={`lease-${i}`}
              companyName={l.company_name}
              subtitle={`${l.location} · ${l.seats} seats · Lease ends ${l.lease_end}`}
              intentScore={l.intent_score}
              remarks={l.remarks}
              whyQualifies={l.why_qualifies}
              talkingPoints={l.talking_points}
              structured={l._structured}
              leadId={l._lead_id}
              onAddToLeads={async () =>
                convert.mutateAsync({
                  kind: "lease",
                  city: brief.city,
                  lead_id: l._lead_id,
                  company_name: l.company_name,
                  location: l.location,
                  seats: l.seats,
                  lease_end: l.lease_end,
                  intent_score: l.intent_score,
                  skip_enrich: true,
                })
              }
              onEnrich={async () =>
                convert.mutateAsync({
                  kind: "lease",
                  city: brief.city,
                  lead_id: l._lead_id,
                  company_name: l.company_name,
                  location: l.location,
                  seats: l.seats,
                  lease_end: l.lease_end,
                  intent_score: l.intent_score,
                })
              }
              onViewLead={l._lead_id ? () => navigate(`/leads/${l._lead_id}`) : undefined}
              onNotRelevant={() => console.log("dismissed", l.company_name)}
            />
          ))}
        </div>
      </Section>

      {/* 2. Funded startups */}
      <Section icon={<TrendingUp className="h-4 w-4" />} label={`2. Startups That Raised Funds · ${brief.funded_startups?.filter(filterItem).length || 0} found`} tone="warning">
        <div className="grid gap-3 md:grid-cols-2">
          {brief.funded_startups?.filter(filterItem).map((s, i) => (
            <BriefCompanyCard
              key={`funded-${i}`}
              itemKey={`funded-${i}`}
              companyName={s.startup_name}
              subtitle={`${s.funding} · ${s.team_size} team`}
              intentScore={s.intent_score}
              remarks={s.use_case}
              whyQualifies={s.why_qualifies}
              talkingPoints={s.talking_points}
              structured={s._structured}
              leadId={s._lead_id}
              onAddToLeads={async () =>
                convert.mutateAsync({
                  kind: "funded",
                  city: brief.city,
                  lead_id: s._lead_id,
                  startup_name: s.startup_name,
                  funding: s.funding,
                  team_size: s.team_size,
                  use_case: s.use_case,
                  intent_score: s.intent_score,
                  skip_enrich: true,
                })
              }
              onEnrich={async () =>
                convert.mutateAsync({
                  kind: "funded",
                  city: brief.city,
                  lead_id: s._lead_id,
                  startup_name: s.startup_name,
                  funding: s.funding,
                  team_size: s.team_size,
                  use_case: s.use_case,
                  intent_score: s.intent_score,
                })
              }
              onViewLead={s._lead_id ? () => navigate(`/leads/${s._lead_id}`) : undefined}
              onNotRelevant={() => console.log("dismissed", s.startup_name)}
            />
          ))}
        </div>
      </Section>

      {/* 3. High Intent Opportunities */}
      {brief.high_intent && brief.high_intent.filter(filterItem).length > 0 && (
        <Section icon={<Sparkles className="h-4 w-4" />} label={`3. High Intent Opportunities · ${brief.high_intent.filter(filterItem).length} found`} tone="violet">
          <div className="grid gap-3 md:grid-cols-2">
            {brief.high_intent.filter(filterItem).map((h, i) => (
              <BriefCompanyCard
                key={`intent-${i}`}
                itemKey={`intent-${i}`}
                companyName={h.company_name}
                subtitle={h.subtitle}
                intentScore={h.intent_score}
                remarks={h.remarks}
                whyQualifies={h.why_qualifies}
                talkingPoints={h.talking_points}
                structured={h._structured}
                leadId={h._lead_id}
                onAddToLeads={async () =>
                  convert.mutateAsync({
                    kind: "high_intent",
                    city: brief.city,
                    lead_id: h._lead_id,
                    company_name: h.company_name,
                    intent_score: h.intent_score,
                    skip_enrich: true,
                  })
                }
                onEnrich={async () =>
                  convert.mutateAsync({
                    kind: "high_intent",
                    city: brief.city,
                    lead_id: h._lead_id,
                    company_name: h.company_name,
                    intent_score: h.intent_score,
                  })
                }
                onViewLead={h._lead_id ? () => navigate(`/leads/${h._lead_id}`) : undefined}
                onNotRelevant={() => console.log("dismissed", h.company_name)}
              />
            ))}
          </div>
        </Section>
      )}

      {/* 3. Market watch */}
      {brief.micro_market_watch?.length > 0 && (
        <Section icon={<MapPin className="h-4 w-4" />} label="3. City Market Watch" tone="info">
          <Card>
            <CardContent className="p-4 space-y-3">
              {brief.micro_market_watch.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-blue-500 mt-0.5">●</div>
                  <div>
                    <div className="font-medium text-sm">{m.micro_market}</div>
                    <div className="text-sm text-muted-foreground">{m.summary}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>
      )}

      {/* 4. Competitor alerts */}
      {brief.competitor_alerts?.length > 0 && (
        <Section icon={<ShieldAlert className="h-4 w-4" />} label="4. Insider Info / Competitor Alerts" tone="danger">
          <Card>
            <CardContent className="p-4 space-y-3">
              {brief.competitor_alerts.map((c, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold">{c.entity}:</span> {c.movement}
                  {c.impact && (
                    <span className="text-muted-foreground"> → {c.impact}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </Section>
      )}

      {/* 5. BD Tips */}
      {(brief.bd_tips?.linkedin_strategy || brief.bd_tips?.script_of_the_day) && (
        <Section icon={<Lightbulb className="h-4 w-4" />} label="5. BD Tips of the Day" tone="violet">
          <Card className="bg-violet-500/5 border-violet-500/20">
            <CardContent className="p-4 space-y-4">
              {brief.bd_tips.linkedin_strategy && (
                <div>
                  <div className="text-xs font-semibold uppercase text-violet-600 mb-1">
                    LinkedIn Strategy
                  </div>
                  <p className="text-sm">{brief.bd_tips.linkedin_strategy}</p>
                </div>
              )}
              {brief.bd_tips.script_of_the_day && (
                <div>
                  <div className="text-xs font-semibold uppercase text-violet-600 mb-1">
                    Script of the Day
                  </div>
                  <p className="text-sm italic bg-background/50 rounded-md p-3 border">
                    "{brief.bd_tips.script_of_the_day}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Actionables */}
      {brief.city_actionables?.length > 0 && (
        <Section icon={<Users className="h-4 w-4" />} label="Actionables · City Leads" tone="primary">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3">BD Rep</th>
                    <th className="p-3">Key follow-ups today</th>
                  </tr>
                </thead>
                <tbody>
                  {brief.city_actionables.map((a, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{a.rep_name}</td>
                      <td className="p-3 text-sm">
                        {(a.follow_ups || []).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </Section>
      )}
    </div>
  );
}

type SectionProps = {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  tone: "success" | "warning" | "info" | "danger" | "violet" | "primary";
};

const Section = forwardRef<HTMLDivElement, SectionProps>(function Section({
  icon,
  label,
  children,
  tone,
}, ref) {
  const toneClass = {
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-blue-600",
    danger: "text-red-600",
    violet: "text-violet-600",
    primary: "text-foreground",
  }[tone];
  return (
    <div ref={ref} className="space-y-3">
      <div className={`flex items-center gap-2 font-semibold ${toneClass}`}>
        {icon}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
});