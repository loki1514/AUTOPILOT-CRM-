import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { Sparkles, Loader2, LayoutGrid, Columns3 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { KanbanColumn } from '@/components/crm/KanbanColumn';
import { FlippableDealCard } from '@/components/crm/FlippableDealCard';
import { LeadDetailSheet } from '@/components/crm/LeadDetailSheet';
import { Button } from '@/components/ui/button';
import { useCrmLeads, useUpdateCrmStatus } from '@/hooks/useCrmLeads';
import { useBdReps } from '@/hooks/useBdReps';
import { CRM_STATUSES, type CrmStatus, type Lead, type ActivityType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ViewMode = 'kanban' | 'grid';

export default function Kanban() {
  const { data: leads = [], isLoading } = useCrmLeads();
  const { data: reps = [] } = useBdReps();
  const updateStatus = useUpdateCrmStatus();

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialActivity, setInitialActivity] = useState<ActivityType | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const grouped = useMemo(() => {
    const map = new Map<CrmStatus, Lead[]>();
    CRM_STATUSES.forEach((s) => map.set(s.value, []));
    leads.forEach((l) => {
      const status = (l.crm_status as CrmStatus) ?? 'new';
      if (!map.has(status)) map.set(status, []);
      map.get(status)!.push(l);
    });
    return map;
  }, [leads]);

  const handleDragEnd = async (e: DragEndEvent) => {
    if (!e.over) return;
    const leadId = String(e.active.id);
    const newStatus = String(e.over.id) as CrmStatus;
    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.crm_status === newStatus) return;
    try {
      await updateStatus.mutateAsync({ id: leadId, crm_status: newStatus });
      await supabase.from('activities').insert({
        lead_id: leadId,
        type: 'status_change',
        content: `${lead.crm_status ?? 'new'} → ${newStatus}`,
      } as any);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to move lead');
    }
  };

  const openLead = (lead: Lead) => {
    setActiveLead(lead);
    setInitialActivity(null);
    setSheetOpen(true);
  };

  const handleQuickAction = (lead: Lead, type: 'call' | 'email' | 'note') => {
    setActiveLead(lead);
    setInitialActivity(type as ActivityType);
    setSheetOpen(true);
  };

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-crm-demo');
      if (error) throw error;
      toast.success(`Seeded ${data?.leads ?? 0} leads + ${data?.reps ?? 0} reps`);
    } catch (e: any) {
      toast.error(e.message ?? 'Seed failed');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <MainLayout>
      <div data-crm className="min-h-screen bg-background text-foreground">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              {leads.length} {leads.length === 1 ? 'lead' : 'leads'} · {viewMode === 'kanban' ? 'drag cards between stages' : 'click cards to flip'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.03] p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'kanban' ? 'bg-white/15 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Columns3 className="h-3.5 w-3.5 inline mr-1.5" />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-white/15 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-3.5 w-3.5 inline mr-1.5" />
                Deals
              </button>
            </div>
            {leads.length === 0 && (
              <Button onClick={seedDemo} disabled={seeding}>
                {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Load demo data
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Loading…
          </div>
        ) : viewMode === 'kanban' ? (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex h-[calc(100vh-5rem)] gap-3 overflow-x-auto p-4">
              {CRM_STATUSES.map((s) => (
                <KanbanColumn
                  key={s.value}
                  status={s.value}
                  label={s.label}
                  leads={grouped.get(s.value) ?? []}
                  reps={reps}
                  onOpen={openLead}
                  onQuickAction={handleQuickAction}
                />
              ))}
            </div>
          </DndContext>
        ) : (
          <div className="p-4">
            {CRM_STATUSES.map((s) => {
              const statusLeads = grouped.get(s.value) ?? [];
              if (statusLeads.length === 0) return null;
              return (
                <div key={s.value} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-sm font-semibold capitalize">{s.label}</h2>
                    <span className="text-xs text-muted-foreground">({statusLeads.length})</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {statusLeads.map((lead) => (
                      <FlippableDealCard
                        key={lead.id}
                        lead={lead}
                        rep={reps.find((r) => r.id === lead.assigned_to)}
                        onOpen={openLead}
                        onQuickAction={handleQuickAction}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <LeadDetailSheet
          lead={activeLead}
          reps={reps}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          initialActivity={initialActivity}
        />
      </div>
    </MainLayout>
  );
}
