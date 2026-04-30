import { useMemo, useState } from 'react';
import { Users, TrendingUp, Target, IndianRupee } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { formatDistanceToNowStrict, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { useCrmLeads } from '@/hooks/useCrmLeads';
import { useActivities, useActivitiesRealtime } from '@/hooks/useActivities';
import { CRM_STATUSES, type Lead } from '@/types';
import { IntentBadge } from './IntentBadge';
import { SourceIcon } from './SourceIcon';
import { TimeRangeToggle, type TimeRange } from '@/components/common/TimeRangeToggle';

function StatTile({ label, value, sub, Icon }: { label: string; value: string | number; sub?: string; Icon: typeof Users }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

const STATUS_COLORS = ['#94a3b8', '#3b82f6', '#06b6d4', '#a855f7', '#f59e0b', '#22c55e', '#ef4444'];

export function CrmDashboard() {
  useActivitiesRealtime();
  const { data: leads = [] } = useCrmLeads();
  const { data: activities = [] } = useActivities();
  const [range, setRange] = useState<TimeRange>('today');

  const rangeStart = useMemo(() => {
    const now = new Date();
    if (range === 'today') return startOfDay(now);
    if (range === 'week') return startOfWeek(now, { weekStartsOn: 1 });
    return startOfMonth(now);
  }, [range]);

  const rangeLabel = range === 'today' ? 'today' : range === 'week' ? 'this week' : 'this month';

  const leadsInRange = useMemo(
    () => leads.filter((l) => new Date(l.created_at).getTime() >= rangeStart.getTime()),
    [leads, rangeStart],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);

    const inDay = (l: Lead, dayStart: Date, dayEnd: Date) => {
      const t = new Date(l.created_at).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    };

    const rangeCount = leadsInRange.length;
    const todayCount = leads.filter((l) => inDay(l, today, new Date(today.getTime() + 86400000))).length;
    const yesterdayCount = leads.filter((l) => inDay(l, yesterday, today)).length;
    const delta = todayCount - yesterdayCount;

    const active = leads.filter((l) => l.crm_status !== 'won' && l.crm_status !== 'lost');
    const avgIntent =
      active.length === 0
        ? 0
        : Math.round(active.reduce((s, l) => s + (l.intent_score ?? 0), 0) / active.length);

    const assigned = leads.filter((l) => l.assigned_to).length;
    const assignedPct = leads.length === 0 ? 0 : Math.round((assigned / leads.length) * 100);

    const pipelineLeads = leads.filter(
      (l) => l.crm_status === 'qualified' || l.crm_status === 'proposal' || l.crm_status === 'negotiation'
    );
    const pipelineValue = pipelineLeads.reduce((s, l) => s + (l.budget_monthly ?? 0) * 12, 0);

    return { rangeCount, todayCount, delta, avgIntent, assignedPct, pipelineValue };
  }, [leads, leadsInRange]);

  const sourceData = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const counts: Record<string, number> = {};
    leads
      .filter((l) => new Date(l.created_at).getTime() >= cutoff)
      .forEach((l) => {
        const k = l.source ?? 'manual';
        counts[k] = (counts[k] ?? 0) + 1;
      });
    return Object.entries(counts).map(([source, count]) => ({ source, count }));
  }, [leads]);

  const dailyData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const next = new Date(d.getTime() + 86400000);
      const count = leads.filter((l) => {
        const t = new Date(l.created_at).getTime();
        return t >= d.getTime() && t < next.getTime();
      }).length;
      days.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
    }
    return days;
  }, [leads]);

  const stageData = useMemo(() => {
    return CRM_STATUSES.map((s) => ({
      name: s.label,
      value: leads.filter((l) => (l.crm_status ?? 'new') === s.value).length,
    })).filter((d) => d.value > 0);
  }, [leads]);

  const topIntent = useMemo(() => {
    return [...leads]
      .filter((l) => (l.crm_status ?? 'new') === 'new')
      .sort((a, b) => (b.intent_score ?? 0) - (a.intent_score ?? 0))
      .slice(0, 5);
  }, [leads]);

  return (
    <div data-crm className="min-h-screen bg-background text-foreground">
      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Pipeline Dashboard</h1>
            <p className="text-sm text-muted-foreground">Live view of leads, intent and activity</p>
          </div>
          <TimeRangeToggle value={range} onChange={setRange} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label={`New Leads · ${rangeLabel}`}
            value={stats.rangeCount}
            sub={
              range === 'today'
                ? stats.delta === 0
                  ? 'same as yesterday'
                  : `${stats.delta > 0 ? '+' : ''}${stats.delta} vs yesterday`
                : `${stats.todayCount} added today`
            }
            Icon={Users}
          />
          <StatTile label="Avg Intent Score" value={stats.avgIntent} sub="active leads" Icon={Target} />
          <StatTile label="Leads Assigned" value={`${stats.assignedPct}%`} sub="of total" Icon={TrendingUp} />
          <StatTile
            label="Pipeline Value"
            value={`₹${(stats.pipelineValue / 100000).toFixed(1)}L`}
            sub="annualized (qualified+)"
            Icon={IndianRupee}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Leads by source (30d)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sourceData}>
                <XAxis dataKey="source" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Daily volume (14d)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Pipeline distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stageData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {stageData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Activity feed</h3>
            {activities.length === 0 ? (
              <p className="text-xs text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.slice(0, 20).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p>
                        <span className="font-medium capitalize">{a.type.replace('_', ' ')}</span>
                        {a.content && <span className="text-muted-foreground"> · {a.content}</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Top intent · uncontacted</h3>
            {topIntent.length === 0 ? (
              <p className="text-xs text-muted-foreground">No new leads.</p>
            ) : (
              <ul className="space-y-2">
                {topIntent.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 rounded border border-border bg-secondary/30 p-2">
                    <SourceIcon source={l.source} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{l.full_name || l.client_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{l.company}</p>
                    </div>
                    <IntentBadge score={l.intent_score ?? 0} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}