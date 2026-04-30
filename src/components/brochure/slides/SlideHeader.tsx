import { cn } from '@/lib/utils';

interface SlideHeaderProps {
  companyName?: string;
  showLogo?: boolean;
  className?: string;
}

export function SlideHeader({
  companyName = 'AUTOPILOT',
  showLogo = true,
  className,
}: SlideHeaderProps) {
  if (!showLogo) return null;

  return (
    <div className={cn('absolute top-12 right-16 z-20', className)}>
      <div className="rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 text-white font-bold px-6 py-3 text-lg shadow-lg">
        {companyName}
      </div>
    </div>
  );
}
