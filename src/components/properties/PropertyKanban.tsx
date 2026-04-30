import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { LeadProperty, LeadPropertyStage, LEAD_PROPERTY_STAGES } from '@/types/property';
import { PropertyCard } from './PropertyCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, GripVertical, FileText, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyKanbanProps {
  leadProperties: LeadProperty[];
  onStageChange: (id: string, stage: LeadPropertyStage) => void;
  onAddProperty: () => void;
  onCreateBrochure: (leadProperty: LeadProperty) => void;
  onRemoveProperty: (id: string) => void;
}

interface KanbanColumnProps {
  stage: LeadPropertyStage;
  label: string;
  items: LeadProperty[];
  onCreateBrochure: (leadProperty: LeadProperty) => void;
  onRemoveProperty: (id: string) => void;
}

interface DraggablePropertyCardProps {
  leadProperty: LeadProperty;
  onCreateBrochure: (leadProperty: LeadProperty) => void;
  onRemoveProperty: (id: string) => void;
}

function DroppableColumn({ stage, label, items, onCreateBrochure, onRemoveProperty }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div className="flex-1 min-w-[280px] max-w-[350px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </h3>
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'space-y-3 min-h-[400px] p-3 rounded-xl border-2 border-dashed transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 bg-muted/30'
        )}
      >
        {items.map((item) => (
          <DraggablePropertyCard
            key={item.id}
            leadProperty={item}
            onCreateBrochure={onCreateBrochure}
            onRemoveProperty={onRemoveProperty}
          />
        ))}
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Drag properties here
          </p>
        )}
      </div>
    </div>
  );
}

function DraggablePropertyCard({ leadProperty, onCreateBrochure, onRemoveProperty }: DraggablePropertyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: leadProperty.id,
    data: { leadProperty },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  if (!leadProperty.property) return null;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Card className="p-3 pl-8 bg-card">
        <div className="flex items-start gap-3">
          {leadProperty.property.images.length > 0 && (
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={leadProperty.property.images[0]}
                alt={leadProperty.property.property_name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {leadProperty.property.property_name}
            </h4>
            {leadProperty.property.location && (
              <p className="text-xs text-muted-foreground truncate">
                {leadProperty.property.location}
              </p>
            )}
            {leadProperty.property.rent_per_sqft && (
              <p className="text-xs text-muted-foreground">
                ₹{leadProperty.property.rent_per_sqft}/sqft
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
          <Button
            size="sm"
            variant="default"
            className="flex-1 h-7 text-xs"
            onClick={() => onCreateBrochure(leadProperty)}
          >
            <FileText className="h-3 w-3 mr-1" />
            Create Brochure
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onRemoveProperty(leadProperty.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function PropertyKanban({
  leadProperties,
  onStageChange,
  onAddProperty,
  onCreateBrochure,
  onRemoveProperty,
}: PropertyKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = leadProperties.find((lp) => lp.id === active.id);
    const overId = over.id as LeadPropertyStage;

    if (activeItem && LEAD_PROPERTY_STAGES.some((s) => s.value === overId)) {
      if (activeItem.stage !== overId) {
        onStageChange(activeItem.id, overId);
      }
    }
  };

  const getItemsByStage = (stage: LeadPropertyStage) =>
    leadProperties.filter((lp) => lp.stage === stage);

  const activeItem = activeId
    ? leadProperties.find((lp) => lp.id === activeId)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Property Options</h2>
        <Button onClick={onAddProperty} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_PROPERTY_STAGES.map((stage) => (
            <DroppableColumn
              key={stage.value}
              stage={stage.value}
              label={stage.label}
              items={getItemsByStage(stage.value)}
              onCreateBrochure={onCreateBrochure}
              onRemoveProperty={onRemoveProperty}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem?.property && (
            <Card className="p-3 bg-card shadow-xl rotate-3">
              <div className="flex items-start gap-3">
                {activeItem.property.images.length > 0 && (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={activeItem.property.images[0]}
                      alt={activeItem.property.property_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {activeItem.property.property_name}
                  </h4>
                  {activeItem.property.location && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activeItem.property.location}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
