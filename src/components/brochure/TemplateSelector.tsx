import { Check, Palette, Sparkles, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrochureTemplate } from '@/types/brochure';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
  selectedTemplate: BrochureTemplate;
  onSelectTemplate: (template: BrochureTemplate) => void;
  onContinue: () => void;
}

const templates: Array<{
  id: BrochureTemplate;
  name: string;
  description: string;
  icon: React.ElementType;
  preview: React.ReactNode;
}> = [
  {
    id: 'autopilot',
    name: 'Autopilot',
    description: 'Colorful cards with icons in a modern grid layout',
    icon: Palette,
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-teal-50 p-3 rounded-lg">
        <div className="text-[0.5rem] font-bold text-center mb-2 text-foreground">Project Details</div>
        <div className="w-full h-8 bg-gradient-to-r from-blue-200 via-teal-200 to-orange-200 rounded-lg mb-2" />
        <div className="grid grid-cols-5 gap-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-4 bg-white rounded shadow-sm" />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean minimal design with photos and subtle shadows',
    icon: Sparkles,
    preview: (
      <div className="w-full h-full bg-white p-3 rounded-lg">
        <div className="w-full h-10 bg-muted rounded-lg mb-2" />
        <div className="text-[0.5rem] font-bold text-center mb-2 text-foreground">Property Name</div>
        <div className="grid grid-cols-3 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-5 bg-muted/50 rounded border border-border/50" />
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional text-focused layout with bold typography',
    icon: FileText,
    preview: (
      <div className="w-full h-full bg-slate-50 p-3 rounded-lg">
        <div className="absolute top-0 right-0 w-12 h-12 bg-purple-200/30 rounded-bl-full" />
        <div className="text-[0.5rem] font-bold mb-2 text-foreground">Property Name</div>
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-1">
              <div className="w-1/3 h-3 bg-slate-200 rounded" />
              <div className="w-2/3 h-3 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  onContinue,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Template</h2>
        <p className="text-muted-foreground">
          Select a layout style for your property brochure
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const Icon = template.icon;

          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={cn(
                'relative group rounded-2xl border-2 p-4 text-left transition-all',
                'hover:shadow-elevated hover:border-primary/50',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-card'
                  : 'border-border bg-card'
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-4 w-4 text-primary-foreground" />
                </div>
              )}

              {/* Preview */}
              <div className="relative h-32 mb-4 rounded-xl overflow-hidden border border-border/50">
                {template.preview}
              </div>

              {/* Info */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-foreground">{template.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onContinue}>
          Continue with {templates.find((t) => t.id === selectedTemplate)?.name}
        </Button>
      </div>
    </div>
  );
}
