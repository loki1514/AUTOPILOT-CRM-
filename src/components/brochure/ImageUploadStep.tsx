import { useCallback } from 'react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BrochureState, BrochureImage } from '@/types/brochure';
import { BrochureStateActions } from '@/hooks/useBrochureState';
import { Button } from '@/components/ui/button';
import { Upload, X, GripVertical, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadStepProps {
  state: BrochureState;
  actions: BrochureStateActions;
}

function SortableImageItem({
  image,
  onRemove,
}: {
  image: BrochureImage;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-xl overflow-hidden border-2 border-border bg-card shadow-sm',
        isDragging && 'opacity-50 border-primary'
      )}
    >
      <img
        src={image.previewUrl}
        alt="Property"
        className="w-full h-40 object-cover"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ImageUploadStep({ state, actions }: ImageUploadStepProps) {
  const { addImage, removeImage, reorderImages } = actions;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = state.images.findIndex((img) => img.id === active.id);
        const newIndex = state.images.findIndex((img) => img.id === over.id);
        reorderImages(oldIndex, newIndex);
      }
    },
    [state.images, reorderImages]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith('image/')) {
            addImage(file);
          }
        });
      }
      e.target.value = '';
    },
    [addImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          addImage(file);
        }
      });
    },
    [addImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Property Images</h2>
        <p className="text-sm text-muted-foreground">
          Upload images of the property. Drag to reorder. First image will be the hero.
        </p>
      </div>

      {/* Upload Zone */}
      <label
        htmlFor="image-upload"
        className={cn(
          'flex flex-col items-center justify-center',
          'h-40 rounded-2xl border-2 border-dashed border-border',
          'bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">
          Drag & drop or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          PNG, JPG, WEBP up to 10 images
        </p>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Image Grid */}
      {state.images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {state.images.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  onRemove={removeImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ImageIcon className="h-16 w-16 opacity-30 mb-4" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
