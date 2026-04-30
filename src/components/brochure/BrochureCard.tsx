import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrochureCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'primary' | 'muted';
  className?: string;
}

export function BrochureCard({
  icon: Icon,
  label,
  value,
  size = 'medium',
  variant = 'default',
  className,
}: BrochureCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-all',
        {
          'bg-card border-border shadow-sm': variant === 'default',
          'bg-primary/5 border-primary/20': variant === 'primary',
          'bg-muted/50 border-muted': variant === 'muted',
        },
        {
          'p-3': size === 'small',
          'p-4': size === 'medium',
          'p-6 col-span-2': size === 'large',
        },
        className
      )}
    >
      <div
        className={cn('flex items-start gap-3', {
          'flex-col items-center text-center': size === 'large',
        })}
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-xl bg-primary/10',
            {
              'h-8 w-8': size === 'small',
              'h-10 w-10': size === 'medium',
              'h-12 w-12': size === 'large',
            }
          )}
        >
          <Icon
            className={cn('text-primary', {
              'h-4 w-4': size === 'small',
              'h-5 w-5': size === 'medium',
              'h-6 w-6': size === 'large',
            })}
          />
        </div>
        <div className={cn({ 'flex-1': size !== 'large' })}>
          <p
            className={cn(
              'uppercase tracking-wider text-muted-foreground font-medium',
              {
                'text-[0.625rem]': size === 'small',
                'text-[0.6875rem]': size === 'medium',
                'text-xs': size === 'large',
              }
            )}
          >
            {label}
          </p>
          <p
            className={cn('font-semibold text-foreground tabular-nums', {
              'text-sm': size === 'small',
              'text-base': size === 'medium',
              'text-xl': size === 'large',
            })}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
