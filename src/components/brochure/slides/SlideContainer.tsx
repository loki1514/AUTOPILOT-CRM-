import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';

interface SlideContainerProps {
  id?: string;
  children: ReactNode;
  className?: string;
  gradient?: 'default' | 'blue' | 'teal' | 'purple' | 'warm';
}

const gradients = {
  default: 'bg-gradient-to-br from-blue-50 via-white to-teal-50',
  blue: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
  teal: 'bg-gradient-to-br from-teal-50 via-white to-blue-50',
  purple: 'bg-gradient-to-br from-purple-50 via-white to-pink-50',
  warm: 'bg-gradient-to-br from-orange-50 via-white to-yellow-50',
};

export function SlideContainer({
  id,
  children,
  className,
  gradient = 'default',
}: SlideContainerProps) {
  return (
    <div
      id={id}
      className={cn(
        'relative overflow-hidden',
        gradients[gradient],
        className
      )}
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
      }}
    >
      {/* Decorative swirls */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-teal-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-[200px] h-[200px] bg-gradient-to-l from-orange-200/20 to-transparent rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 w-full h-full p-16">{children}</div>
    </div>
  );
}
