import { Heading1, AlignLeft, List, Image, MousePointerClick, Minus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { EmailBlockType } from '@/types/email';

interface BlockToolbarProps {
  onAddBlock: (type: EmailBlockType) => void;
  disabled?: boolean;
}

const blockTypes: { type: EmailBlockType; icon: typeof Heading1; label: string }[] = [
  { type: 'heading', icon: Heading1, label: 'Heading' },
  { type: 'paragraph', icon: AlignLeft, label: 'Paragraph' },
  { type: 'bullets', icon: List, label: 'Bullet List' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'cta', icon: MousePointerClick, label: 'Call to Action' },
  { type: 'divider', icon: Minus, label: 'Divider' },
  { type: 'footer', icon: FileText, label: 'Footer' },
];

export function BlockToolbar({ onAddBlock, disabled }: BlockToolbarProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border">
      <span className="text-xs font-medium text-muted-foreground mr-2 self-center">
        Add Block:
      </span>
      {blockTypes.map(({ type, icon: Icon, label }) => (
        <Tooltip key={type}>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddBlock(type)}
              disabled={disabled}
              className="h-8"
            >
              <Icon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add {label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
