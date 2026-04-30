import { useDraggable } from '@dnd-kit/core';
import { Phone, Mail, StickyNote } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { Lead, BdRep } from '@/types';
import { IntentBadge } from './IntentBadge';
import { SourceIcon } from './SourceIcon';
import { RepAvatar } from './RepAvatar';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  lead: Lead;
  rep?: BdRep | null;
  onOpen: (lead: Lead) => void;
  onQuickAction: (lead: Lead, type: 'call' | 'email' | 'note') => void;
}

export function KanbanCard({ lead, rep, onOpen, onQuickAction }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const days = lead.last_activity
    ? formatDistanceToNowStrict(new Date(lead.last_activity), { addSuffix: false })
    : '—';

  const name = lead.full_name || lead.client_name;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow',
        isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
      )}
    >
      <div
        {...listeners}
        {...attributes}
        onClick={(e) => {
          // Suppress click when dragging
          if (isDragging) return;
          // Open only if not a button click
          const target = e.target as HTMLElement;
          if (target.closest('button')) return;
          onOpen(lead);
        }}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{lead.company}</p>
          </div>
          <IntentBadge score={lead.intent_score ?? 0} />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <SourceIcon source={lead.source} />
            <RepAvatar rep={rep} />
          </div>
          <span className="text-[10px] text-muted-foreground tabular-nums" title="Days in stage">
            {days}
          </span>
        </div>

        {lead.office_size_needed && (
          <p className="mt-2 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {lead.office_size_needed}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1 border-t border-border pt-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction(lead, 'call');
          }}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="Log call"
        >
          <Phone className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction(lead, 'email');
          }}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="Log email"
        >
          <Mail className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction(lead, 'note');
          }}
          className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="Add note"
        >
          <StickyNote className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}