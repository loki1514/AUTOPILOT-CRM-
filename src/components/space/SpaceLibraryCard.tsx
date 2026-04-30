import { Plus, Image as ImageIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SpaceLibraryItem } from '@/types/space';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface SpaceLibraryCardProps {
  space: SpaceLibraryItem;
  onAdd: (space: SpaceLibraryItem) => void;
}

export function SpaceLibraryCard({ space, onAdd }: SpaceLibraryCardProps) {
  const hasImages = space.images && space.images.length > 0;

  return (
    <div className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Thumbnail */}
      <HoverCard openDelay={300}>
        <HoverCardTrigger asChild>
          <div className="flex h-14 w-14 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-muted transition-transform duration-200 group-hover:scale-105">
            {hasImages ? (
              <img
                src={space.images[0]}
                alt={space.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
            )}
          </div>
        </HoverCardTrigger>
        {hasImages && (
          <HoverCardContent className="w-72 p-3" align="start">
            <img
              src={space.images[0]}
              alt={space.name}
              className="w-full rounded-lg"
            />
            {space.images.length > 1 && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                +{space.images.length - 1} more image{space.images.length > 2 ? 's' : ''}
              </p>
            )}
          </HoverCardContent>
        )}
      </HoverCard>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2">
          <h3 className="truncate text-[0.9375rem] font-semibold text-foreground">
            {space.name}
          </h3>
          {space.is_custom && (
            <Badge variant="secondary" className="shrink-0 text-[0.6875rem] font-medium">
              Custom
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-muted-foreground">
          <span className="font-semibold text-primary">{space.area_sqft} sqft</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{space.category}</span>
          {space.seats > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {space.seats}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Add Button */}
      <Button
        size="sm"
        onClick={() => onAdd(space)}
        className="shrink-0 gap-1.5 rounded-lg px-4 opacity-80 shadow-sm transition-all duration-200 group-hover:opacity-100"
      >
        <Plus className="h-4 w-4" />
        Add
      </Button>
    </div>
  );
}
