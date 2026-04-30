import { EmailBlock } from '@/types/email';
import { cn } from '@/lib/utils';

interface EmailBlockPreviewProps {
  blocks: EmailBlock[];
  subject?: string;
  className?: string;
}

export function EmailBlockPreview({ blocks, subject, className }: EmailBlockPreviewProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No content to preview
      </div>
    );
  }

  return (
    <div className={cn("bg-background border rounded-lg overflow-hidden", className)}>
      {/* Email Header */}
      {subject && (
        <div className="bg-muted/50 px-6 py-4 border-b">
          <p className="text-sm text-muted-foreground">Subject</p>
          <p className="font-medium">{subject}</p>
        </div>
      )}

      {/* Email Body */}
      <div className="p-6 space-y-4">
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function BlockRenderer({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="text-xl font-bold text-foreground">
          {block.content}
        </h2>
      );

    case 'paragraph':
      return (
        <p className="text-foreground leading-relaxed">
          {block.content}
        </p>
      );

    case 'bullets':
      return (
        <div className="space-y-2">
          {block.content && (
            <p className="font-medium text-foreground">{block.content}</p>
          )}
          <ul className="list-disc list-inside space-y-1 text-foreground">
            {block.items?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case 'cta':
      return (
        <div className="py-2">
          {block.content && (
            <p className="mb-3 text-foreground">{block.content}</p>
          )}
          <div 
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium cursor-default"
          >
            {block.buttonText || 'Click Here'}
          </div>
          {block.buttonUrl && (
            <p className="mt-2 text-xs text-muted-foreground">
              Links to: {block.buttonUrl}
            </p>
          )}
        </div>
      );

    case 'footer':
      return (
        <div className="pt-4 mt-4 border-t text-sm text-muted-foreground">
          {block.content}
        </div>
      );

    case 'image':
      return (
        <div className="py-2">
          {block.imageUrl ? (
            <img 
              src={block.imageUrl} 
              alt={block.altText || 'Email image'} 
              className="max-w-full h-auto rounded"
            />
          ) : (
            <div className="bg-muted rounded p-8 text-center text-muted-foreground">
              [Image Placeholder]
              {block.content && <p className="mt-2 text-sm">{block.content}</p>}
            </div>
          )}
        </div>
      );

    default:
      return (
        <p className="text-foreground">{block.content}</p>
      );
  }
}
