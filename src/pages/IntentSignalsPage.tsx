import { formatDistanceToNowStrict } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useIntentSignals } from '@/hooks/useIntentSignals';
import { useCrmLeads } from '@/hooks/useCrmLeads';

export default function IntentSignalsPage() {
  const { data: signals = [], isLoading } = useIntentSignals();
  const { data: leads = [] } = useCrmLeads();
  const leadsById = new Map(leads.map((l) => [l.id, l]));

  return (
    <MainLayout>
      <div data-crm className="min-h-screen bg-background text-foreground">
        <div className="space-y-6 p-6 lg:p-8">
          <div>
            <h1 className="text-2xl font-semibold">Intent Signals</h1>
            <p className="text-sm text-muted-foreground">
              Buying signals detected for your leads. Phase 2 will populate this from Apollo, OpenRouter Research, ScrapingBee and webhooks.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Lead</th>
                  <th className="px-4 py-2 text-left font-medium">Signal</th>
                  <th className="px-4 py-2 text-left font-medium">Detail</th>
                  <th className="px-4 py-2 text-left font-medium">Source</th>
                  <th className="px-4 py-2 text-right font-medium">Score</th>
                  <th className="px-4 py-2 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
                )}
                {!isLoading && signals.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No signals yet — Phase 2 will start populating these.
                  </td></tr>
                )}
                {signals.map((s) => {
                  const lead = leadsById.get(s.lead_id);
                  return (
                    <tr key={s.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2">
                        <div className="font-medium">{lead?.full_name || lead?.client_name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{lead?.company}</div>
                      </td>
                      <td className="px-4 py-2 capitalize">{s.signal_type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-2 text-muted-foreground">{s.signal_value ?? '—'}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{s.source_api ?? '—'}</td>
                      <td className="px-4 py-2 text-right tabular-nums">+{s.score_contribution}</td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(s.detected_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}