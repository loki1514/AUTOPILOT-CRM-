import { cn } from '@/lib/utils';
import type { LeadStage } from '@/types';

const stageConfig: Record<LeadStage, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-stage-lead' },
  qualified: { label: 'Qualified', className: 'bg-stage-qualified' },
  proposal: { label: 'Proposal', className: 'bg-stage-proposal' },
  closed: { label: 'Closed', className: 'bg-stage-closed' },
  lost: { label: 'Lost', className: 'bg-stage-lost' },
};

interface StageBadgeProps {
  stage: LeadStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const config = stageConfig[stage];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-primary-foreground',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
