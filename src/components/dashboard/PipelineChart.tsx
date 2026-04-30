import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Lead, LeadStage } from '@/types';

const stageColors: Record<LeadStage, string> = {
  lead: 'hsl(220, 15%, 55%)',
  qualified: 'hsl(38, 92%, 50%)',
  proposal: 'hsl(175, 80%, 35%)',
  closed: 'hsl(142, 70%, 40%)',
  lost: 'hsl(0, 72%, 51%)',
};

const stageLabels: Record<LeadStage, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  proposal: 'Proposal',
  closed: 'Closed',
  lost: 'Lost',
};

interface PipelineChartProps {
  leads: Lead[];
}

export function PipelineChart({ leads }: PipelineChartProps) {
  const data = useMemo(() => {
    const stages: LeadStage[] = ['lead', 'qualified', 'proposal', 'closed', 'lost'];
    return stages.map((stage) => ({
      name: stageLabels[stage],
      stage,
      count: leads.filter((lead) => lead.stage === stage).length,
      color: stageColors[stage],
    }));
  }, [leads]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold mb-4">Pipeline Overview</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              width={80}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
