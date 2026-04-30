import { cn } from '@/lib/utils';

interface IntentBadgeProps {
  score: number;
  className?: string;
}

export function IntentBadge({ score, className }: IntentBadgeProps) {
  const tier =
    score >= 71 ? 'high' : score >= 41 ? 'mid' : 'low';
  const colorVar =
    tier === 'high'
      ? 'var(--crm-intent-high)'
      : tier === 'mid'
      ? 'var(--crm-intent-mid)'
      : 'var(--crm-intent-low)';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        className
      )}
      style={{
        backgroundColor: `hsl(${colorVar} / 0.15)`,
        color: `hsl(${colorVar})`,
        border: `1px solid hsl(${colorVar} / 0.3)`,
      }}
      title={`Intent score: ${score}`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `hsl(${colorVar})` }}
      />
      {score}
    </span>
  );
}