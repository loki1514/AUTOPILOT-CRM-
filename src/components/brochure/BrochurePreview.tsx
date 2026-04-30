import { BrochureState } from '@/types/brochure';
import { AutopilotTemplate, ModernTemplate, ClassicTemplate } from './templates';

interface BrochurePreviewProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  fullSize?: boolean;
  id?: string;
}

export function BrochurePreview({
  state,
  populatedFields,
  fullSize = false,
  id,
}: BrochurePreviewProps) {
  switch (state.selectedTemplate) {
    case 'autopilot':
      return (
        <AutopilotTemplate
          state={state}
          populatedFields={populatedFields}
          fullSize={fullSize}
          id={id}
        />
      );
    case 'modern':
      return (
        <ModernTemplate
          state={state}
          populatedFields={populatedFields}
          fullSize={fullSize}
          id={id}
        />
      );
    case 'classic':
      return (
        <ClassicTemplate
          state={state}
          populatedFields={populatedFields}
          fullSize={fullSize}
          id={id}
        />
      );
    default:
      return (
        <AutopilotTemplate
          state={state}
          populatedFields={populatedFields}
          fullSize={fullSize}
          id={id}
        />
      );
  }
}
