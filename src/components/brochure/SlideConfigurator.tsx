import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BrochureState, SLIDE_LABELS, SlideType } from '@/types/brochure';
import { BrochureStateActions } from '@/hooks/useBrochureState';
import { ArrowRight, GripVertical, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SlideConfiguratorProps {
  state: BrochureState;
  actions: BrochureStateActions;
  onContinue: () => void;
}

interface SortableSlideItemProps {
  slideId: string;
  slideType: SlideType;
  enabled: boolean;
  onToggle: () => void;
}

function SortableSlideItem({
  slideId,
  slideType,
  enabled,
  onToggle,
}: SortableSlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slideId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-4 p-4 bg-white rounded-xl border border-border shadow-sm',
        isDragging && 'opacity-50 shadow-lg',
        !enabled && 'opacity-60'
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <p className="font-medium text-foreground">
          {SLIDE_LABELS[slideType] || slideType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </p>
      </div>

      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}

export function SlideConfigurator({
  state,
  actions,
  onContinue,
}: SlideConfiguratorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const enabledSlides = [...state.slides]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  const disabledSlides = state.slides.filter((s) => !s.enabled);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = enabledSlides.findIndex((s) => s.id === active.id);
      const newIndex = enabledSlides.findIndex((s) => s.id === over.id);
      actions.reorderSlides(oldIndex, newIndex);
    }
  };

  const enabledCount = enabledSlides.length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Configure Slides
        </h2>
        <p className="text-muted-foreground">
          Choose which slides to include and drag to reorder them. Your
          presentation will have {enabledCount} slide
          {enabledCount !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Enabled Slides (Sortable) */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Included Slides ({enabledCount})
        </h3>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={enabledSlides.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {enabledSlides.map((slide) => (
                <SortableSlideItem
                  key={slide.id}
                  slideId={slide.id}
                  slideType={slide.type}
                  enabled={slide.enabled}
                  onToggle={() => actions.toggleSlide(slide.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Disabled Slides */}
      {disabledSlides.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Available Slides
          </h3>
          <div className="space-y-2">
            {disabledSlides.map((slide) => (
              <div
                key={slide.id}
                className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border border-border/50"
              >
                <Layout className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium text-muted-foreground">
                    {SLIDE_LABELS[slide.type] || slide.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </p>
                </div>
                <Switch
                  checked={slide.enabled}
                  onCheckedChange={() => actions.toggleSlide(slide.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <Button onClick={onContinue} disabled={enabledCount === 0}>
          Next: Enter Content
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
