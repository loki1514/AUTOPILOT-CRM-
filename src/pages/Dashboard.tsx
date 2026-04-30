import { useMemo } from 'react';
import { Users, TrendingUp, Building2, Sparkles } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/ui/stat-card';
import { PipelineChart } from '@/components/dashboard/PipelineChart';
import { SourceRings } from '@/components/dashboard/SourceRings';
import { TopIntentCards } from '@/components/dashboard/TopIntentCards';
import { useLeads } from '@/hooks/useLeads';
import { GlassCard } from '@/components/atmosphere/GlassCard';

export default function Dashboard() {
  const { data: leads = [], isLoading } = useLeads();

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const activeLeads = leads.filter((l) => !['closed', 'lost'].includes(l.stage)).length;
    const closedDeals = leads.filter((l) => l.stage === 'closed').length;
    const outreachReady = leads.filter((l) => (l as any).enrichment_status === 'outreach_ready').length;

    return { totalLeads, activeLeads, closedDeals, outreachReady };
  }, [leads]);

  // Derive source counts from leads data
  const sourceCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailyBriefToday = leads.filter((l) => l.source === 'daily_brief' && new Date(l.created_at) >= today).length;
    const dailyBriefMonth = leads.filter((l) => l.source === 'daily_brief' && new Date(l.created_at) >= monthStart).length;
    const metaToday = leads.filter((l) => l.source === 'meta' && new Date(l.created_at) >= today).length;
    const metaMonth = leads.filter((l) => l.source === 'meta' && new Date(l.created_at) >= monthStart).length;
    const linkedinToday = leads.filter((l) => l.source === 'linkedin' && new Date(l.created_at) >= today).length;
    const linkedinMonth = leads.filter((l) => l.source === 'linkedin' && new Date(l.created_at) >= monthStart).length;

    return { dailyBriefToday, dailyBriefMonth, metaToday, metaMonth, linkedinToday, linkedinMonth };
  }, [leads]);

  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time overview of your pipeline and intent signals
          </p>
        </div>

        {/* Source Rings — visual centerpiece */}
        <GlassCard variant="subtle" className="p-6">
          <SourceRings
            dailyBriefCount={sourceCounts.dailyBriefToday}
            metaCount={sourceCounts.metaToday}
            linkedinCount={sourceCounts.linkedinToday}
            monthlyBriefs={sourceCounts.dailyBriefMonth}
            monthlyMeta={sourceCounts.metaMonth}
            monthlyLinkedin={sourceCounts.linkedinMonth}
          />
        </GlassCard>

        {/* KPI Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Active Pipeline"
            value={stats.activeLeads}
            subtitle="leads in progress"
            icon={TrendingUp}
          />
          <StatCard
            title="Closed Deals"
            value={stats.closedDeals}
            icon={Building2}
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Outreach Ready"
            value={stats.outreachReady}
            subtitle="enriched & scored"
            icon={Sparkles}
          />
        </div>

        {/* Top Intent Leads */}
        <TopIntentCards leads={leads} />

        {/* Pipeline Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PipelineChart leads={leads} />
          <GlassCard variant="subtle" className="p-6">
            <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                • Run enrichment on unenriched leads to populate intent scores
              </p>
              <p className="text-xs text-muted-foreground">
                • Review leads marked &quot;needs_manual_research&quot; for manual contact finding
              </p>
              <p className="text-xs text-muted-foreground">
                • Check Daily Briefs for new companies showing intent signals
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </MainLayout>
  );
}
