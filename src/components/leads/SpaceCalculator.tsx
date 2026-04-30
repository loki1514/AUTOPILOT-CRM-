import { useState, useMemo, useEffect } from 'react';
import { Plus, Minus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SPACE_MODULES, type SpaceModule, type SpaceCalculation } from '@/types';

interface SpaceCalculatorProps {
  calculation?: SpaceCalculation | null;
  leadId: string;
  onSave: (data: {
    id?: string;
    lead_id: string;
    modules: SpaceModule[];
    total_carpet_area: number;
    total_seats: number;
  }) => void;
  isLoading?: boolean;
}

type ModuleType = SpaceModule['type'];

const moduleTypes: ModuleType[] = [
  'workstation',
  'cabin_small',
  'cabin_large',
  'meeting_room_small',
  'meeting_room_large',
  'conference_room',
  'phone_booth',
  'break_area',
  'reception',
  'server_room',
];

export function SpaceCalculator({ calculation, leadId, onSave, isLoading }: SpaceCalculatorProps) {
  const [quantities, setQuantities] = useState<Record<ModuleType, number>>(() => {
    const initial: Record<ModuleType, number> = {} as Record<ModuleType, number>;
    moduleTypes.forEach((type) => {
      const existing = calculation?.modules.find((m) => m.type === type);
      initial[type] = existing?.quantity ?? 0;
    });
    return initial;
  });

  useEffect(() => {
    if (calculation?.modules) {
      const updated: Record<ModuleType, number> = {} as Record<ModuleType, number>;
      moduleTypes.forEach((type) => {
        const existing = calculation.modules.find((m) => m.type === type);
        updated[type] = existing?.quantity ?? 0;
      });
      setQuantities(updated);
    }
  }, [calculation]);

  const updateQuantity = (type: ModuleType, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  const { modules, totalArea, totalSeats } = useMemo(() => {
    const mods: SpaceModule[] = [];
    let area = 0;
    let seats = 0;

    moduleTypes.forEach((type) => {
      const qty = quantities[type];
      if (qty > 0) {
        const spec = SPACE_MODULES[type];
        mods.push({
          type,
          name: spec.name,
          quantity: qty,
          area_sqft: spec.area_sqft * qty,
          seats: spec.seats * qty,
        });
        area += spec.area_sqft * qty;
        seats += spec.seats * qty;
      }
    });

    return { modules: mods, totalArea: area, totalSeats: seats };
  }, [quantities]);

  const handleSave = () => {
    onSave({
      id: calculation?.id,
      lead_id: leadId,
      modules,
      total_carpet_area: totalArea,
      total_seats: totalSeats,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {moduleTypes.map((type) => {
          const spec = SPACE_MODULES[type];
          const qty = quantities[type];
          const subtotalArea = spec.area_sqft * qty;
          const subtotalSeats = spec.seats * qty;

          return (
            <div
              key={type}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div className="flex-1">
                <p className="font-medium">{spec.name}</p>
                <p className="text-sm text-muted-foreground">
                  {spec.area_sqft} sqft • {spec.seats} seats each
                </p>
              </div>

              <div className="flex items-center gap-4">
                {qty > 0 && (
                  <div className="text-right text-sm">
                    <p className="font-mono">{subtotalArea.toLocaleString()} sqft</p>
                    <p className="text-muted-foreground">{subtotalSeats} seats</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(type, -1)}
                    disabled={qty === 0}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-mono text-lg">{qty}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => updateQuantity(type, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Calculation</p>
            <div className="mt-1 flex items-baseline gap-4">
              <span className="text-2xl font-semibold">{totalArea.toLocaleString()} sqft</span>
              <span className="text-lg text-muted-foreground">{totalSeats} seats</span>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isLoading || modules.length === 0} className="gap-2">
            <Save className="h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
