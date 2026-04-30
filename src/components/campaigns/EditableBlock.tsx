import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Settings, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { EmailBlock, EmailBlockType } from '@/types/email';

interface EditableBlockProps {
  block: EmailBlock;
  onUpdate: (block: EmailBlock) => void;
  onDelete: (id: string) => void;
  isReadOnly?: boolean;
}

export function EditableBlock({ block, onUpdate, onDelete, isReadOnly }: EditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, disabled: isReadOnly });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleContentChange = (newContent: string) => {
    onUpdate({ ...block, content: newContent });
  };

  const handleBulletChange = (index: number, value: string) => {
    const newItems = [...(block.items || [])];
    newItems[index] = value;
    onUpdate({ ...block, items: newItems });
  };

  const addBullet = () => {
    const newItems = [...(block.items || []), ''];
    onUpdate({ ...block, items: newItems });
  };

  const removeBullet = (index: number) => {
    const newItems = (block.items || []).filter((_, i) => i !== index);
    onUpdate({ ...block, items: newItems });
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <div
            className={cn(
              'text-xl font-bold text-foreground cursor-text p-2 rounded',
              !isReadOnly && 'hover:bg-muted/50'
            )}
            contentEditable={!isReadOnly}
            suppressContentEditableWarning
            onBlur={(e) => handleContentChange(e.currentTarget.textContent || '')}
          >
            {block.content || 'Click to add heading...'}
          </div>
        );

      case 'paragraph':
        return (
          <Textarea
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Enter paragraph text..."
            className="min-h-[80px] resize-none border-0 focus-visible:ring-0 bg-transparent"
            disabled={isReadOnly}
          />
        );

      case 'bullets':
        return (
          <div className="space-y-2">
            {(block.items || []).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-primary">•</span>
                <Input
                  value={item}
                  onChange={(e) => handleBulletChange(index, e.target.value)}
                  placeholder={`Bullet point ${index + 1}`}
                  className="flex-1 border-0 focus-visible:ring-0 bg-transparent"
                  disabled={isReadOnly}
                />
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeBullet(index)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addBullet}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" /> Add bullet
              </Button>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt={block.altText || 'Email image'}
                className="max-w-full h-auto rounded border"
              />
            ) : (
              <div className="h-32 bg-muted rounded border-2 border-dashed flex items-center justify-center text-muted-foreground">
                No image set
              </div>
            )}
            {!isReadOnly && (
              <div className="space-y-2">
                <Input
                  value={block.imageUrl || ''}
                  onChange={(e) => onUpdate({ ...block, imageUrl: e.target.value })}
                  placeholder="Image URL"
                />
                <Input
                  value={block.altText || ''}
                  onChange={(e) => onUpdate({ ...block, altText: e.target.value })}
                  placeholder="Alt text"
                />
              </div>
            )}
          </div>
        );

      case 'cta':
        return (
          <div className="space-y-2">
            <div className="flex justify-center">
              <button
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium"
                disabled
              >
                {block.buttonText || 'Click here'}
              </button>
            </div>
            {!isReadOnly && (
              <div className="space-y-2">
                <Input
                  value={block.buttonText || ''}
                  onChange={(e) => onUpdate({ ...block, buttonText: e.target.value })}
                  placeholder="Button text"
                />
                <Input
                  value={block.buttonUrl || ''}
                  onChange={(e) => onUpdate({ ...block, buttonUrl: e.target.value })}
                  placeholder="Button URL"
                />
              </div>
            )}
          </div>
        );

      case 'divider':
        return <hr className="border-t border-border my-4" />;

      case 'footer':
        return (
          <div className="text-center text-xs text-muted-foreground p-4 bg-muted/30 rounded">
            <Textarea
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Footer text (company address, unsubscribe link, etc.)"
              className="min-h-[60px] resize-none border-0 focus-visible:ring-0 bg-transparent text-center text-xs"
              disabled={isReadOnly}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const getBlockLabel = (type: EmailBlockType) => {
    const labels: Record<EmailBlockType, string> = {
      heading: 'Heading',
      paragraph: 'Paragraph',
      bullets: 'Bullet List',
      image: 'Image',
      cta: 'Call to Action',
      divider: 'Divider',
      footer: 'Footer',
    };
    return labels[type];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative border rounded-lg p-4 bg-card transition-all',
        isDragging && 'opacity-50 shadow-lg',
        !isReadOnly && 'hover:border-primary/50'
      )}
    >
      {/* Block type label */}
      <div className="absolute -top-3 left-3 px-2 bg-card text-xs text-muted-foreground font-medium">
        {getBlockLabel(block.type)}
      </div>

      {/* Drag handle and actions */}
      {!isReadOnly && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="p-1 bg-muted rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {!isReadOnly && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <Button
            variant="destructive"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Block content */}
      <div className="mt-2">{renderBlockContent()}</div>
    </div>
  );
}
