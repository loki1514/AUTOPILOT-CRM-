import { Trash2, Copy, X, Calculator, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectedSpace } from '@/types/space';
import { toast } from 'sonner';

interface SelectedSpacesListProps {
  spaces: SelectedSpace[];
  totalArea: number;
  totalSeats: number;
  totalElements: number;
  onUpdateQuantity: (spaceId: string, quantity: number) => void;
  onRemove: (spaceId: string) => void;
  onClear: () => void;
  onCopyJson: () => void;
}

export function SelectedSpacesList({
  spaces,
  totalArea,
  totalSeats,
  totalElements,
  onUpdateQuantity,
  onRemove,
  onClear,
  onCopyJson,
}: SelectedSpacesListProps) {
  const handleCopy = () => {
    onCopyJson();
    toast.success('JSON copied to clipboard');
  };

  if (spaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Calculator className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <p className="text-[0.9375rem] text-muted-foreground">
          Add spaces from the library to start calculating
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">Selected Spaces</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1.5 rounded-lg text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="gap-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Items List */}
      <div className="max-h-80 divide-y divide-border overflow-y-auto">
        {spaces.map((space) => (
          <div key={space.spaceId} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.875rem] font-medium text-foreground">{space.name}</p>
              <p className="text-xs text-muted-foreground">
                {space.areaEach} sqft × {space.quantity}
              </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => onUpdateQuantity(space.spaceId, space.quantity - 1)}
                disabled={space.quantity <= 1}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold text-foreground">
                {space.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => onUpdateQuantity(space.spaceId, space.quantity + 1)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Subtotal */}
            <div className="w-20 text-right">
              <p className="text-[0.875rem] font-semibold text-primary">
                {space.totalArea.toFixed(0)} sqft
              </p>
            </div>

            {/* Remove */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(space.spaceId)}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-primary/20 bg-primary/5 px-5 py-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Area</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-primary">
              {totalArea.toLocaleString()} <span className="text-lg font-medium">sqft</span>
            </p>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Seats</p>
            <p className="mt-1 text-xl font-bold text-foreground">{totalSeats}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Elements</p>
            <p className="mt-1 text-xl font-bold text-foreground">{totalElements}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
