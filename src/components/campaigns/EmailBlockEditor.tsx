import { useState, useEffect } from 'react';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Monitor, Smartphone, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toggle } from '@/components/ui/toggle';
import { EditableBlock } from './EditableBlock';
import { BlockToolbar } from './BlockToolbar';
import { useEmailTemplate } from '@/hooks/useEmailTemplate';
import { cn } from '@/lib/utils';
import type { EmailBlock, EmailBlockType } from '@/types/email';

// Simple debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface EmailBlockEditorProps {
  campaignId: string;
  isReadOnly?: boolean;
  onEdit?: () => void; // Called when user edits content (to reset approval)
}

export function EmailBlockEditor({ campaignId, isReadOnly, onEdit }: EmailBlockEditorProps) {
  const { template, isLoading, updateTemplate, saveTemplate } = useEmailTemplate(campaignId);
  const [subject, setSubject] = useState('');
  const [blocks, setBlocks] = useState<EmailBlock[]>([]);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced blocks for auto-save
  const debouncedBlocks = useDebounceValue(blocks, 1000);
  const debouncedSubject = useDebounceValue(subject, 1000);

  // Initialize from template
  useEffect(() => {
    if (template) {
      setSubject(template.subject || '');
      setBlocks(template.blocks || []);
    }
  }, [template]);

  // Auto-save on debounced changes
  useEffect(() => {
    if (!isReadOnly && template && hasUnsavedChanges) {
      const doSave = async () => {
        setIsSaving(true);
        try {
          await updateTemplate.mutateAsync({
            subject: debouncedSubject,
            blocks: debouncedBlocks,
          });
          setHasUnsavedChanges(false);
        } finally {
          setIsSaving(false);
        }
      };
      doSave();
    }
  }, [debouncedBlocks, debouncedSubject]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newBlocks = arrayMove(items, oldIndex, newIndex);
        setHasUnsavedChanges(true);
        onEdit?.();
        return newBlocks;
      });
    }
  };

  const handleAddBlock = (type: EmailBlockType) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      items: type === 'bullets' ? [''] : undefined,
      buttonText: type === 'cta' ? 'Learn More' : undefined,
      buttonUrl: type === 'cta' ? 'https://' : undefined,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setHasUnsavedChanges(true);
    onEdit?.();
  };

  const handleUpdateBlock = (updatedBlock: EmailBlock) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === updatedBlock.id ? updatedBlock : block))
    );
    setHasUnsavedChanges(true);
    onEdit?.();
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    setHasUnsavedChanges(true);
    onEdit?.();
  };

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    setHasUnsavedChanges(true);
    onEdit?.();
  };

  const handleManualSave = async () => {
    if (!template) {
      // Create new template
      await saveTemplate.mutateAsync({
        subject,
        blocks,
      });
    } else {
      await updateTemplate.mutateAsync({
        subject,
        blocks,
      });
    }
    setHasUnsavedChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Toggle
            pressed={!isMobilePreview}
            onPressedChange={() => setIsMobilePreview(false)}
            aria-label="Desktop preview"
          >
            <Monitor className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={isMobilePreview}
            onPressedChange={() => setIsMobilePreview(true)}
            aria-label="Mobile preview"
          >
            <Smartphone className="h-4 w-4" />
          </Toggle>
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {hasUnsavedChanges && !isSaving && (
            <span className="text-sm text-amber-500">Unsaved changes</span>
          )}
          {!isReadOnly && (
            <Button
              onClick={handleManualSave}
              disabled={saveTemplate.isPending || updateTemplate.isPending}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Subject line */}
      <div className="space-y-2">
        <Label htmlFor="subject">Subject Line</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => handleSubjectChange(e.target.value)}
          placeholder="Enter email subject..."
          disabled={isReadOnly}
          className="text-lg font-medium"
        />
      </div>

      {/* Block toolbar */}
      {!isReadOnly && <BlockToolbar onAddBlock={handleAddBlock} />}

      {/* Editor area */}
      <div
        className={cn(
          'mx-auto bg-background border rounded-lg shadow-sm transition-all',
          isMobilePreview ? 'max-w-[375px]' : 'max-w-[600px]'
        )}
      >
        <div className="p-4 border-b bg-muted/30">
          <div className="text-sm text-muted-foreground">
            Subject: <span className="font-medium text-foreground">{subject || '(No subject)'}</span>
          </div>
        </div>

        <div className="p-6 space-y-4 min-h-[300px]">
          {blocks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">No content blocks yet.</p>
              {!isReadOnly && <p className="text-sm">Use the toolbar above to add blocks.</p>}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                {blocks.map((block) => (
                  <EditableBlock
                    key={block.id}
                    block={block}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
