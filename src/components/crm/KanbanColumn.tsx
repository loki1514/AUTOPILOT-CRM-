import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { CrmStatus, Lead, BdRep } from '@/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: CrmStatus;
  label: string;
  leads: Lead[];
  reps: BdRep[];
  onOpen: (lead: Lead) => void;
  onQuickAction: (lead: Lead, type: 'call' | 'email' | 'note') => void;
}

export function KanbanColumn({
  status,
  label,
  leads,
  reps,
  onOpen,
  onQuickAction,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const repsById = new Map(reps.map((r) => [r.id, r]));

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full w-72 shrink-0 flex-col rounded-lg border border-border bg-secondary/30 transition-colors',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
            {leads.length}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {leads.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Drop leads here
          </p>
        )}
        {leads.map((lead) => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            rep={lead.assigned_to ? repsById.get(lead.assigned_to) : null}
            onOpen={onOpen}
            onQuickAction={onQuickAction}
          />
        ))}
      </div>
    </div>
  );
}