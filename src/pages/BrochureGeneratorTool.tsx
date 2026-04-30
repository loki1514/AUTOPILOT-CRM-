import { MainLayout } from '@/components/layout/MainLayout';
import { BrochureWizard } from '@/components/brochure/BrochureWizard';
import { useBrochureState } from '@/hooks/useBrochureState';

export default function BrochureGeneratorTool() {
  const brochureState = useBrochureState();

  return (
    <MainLayout>
      <div className="h-[calc(100vh-4.5rem)]">
        <div className="border-b border-border bg-card px-8 py-6">
          <h1 className="text-2xl font-bold">Property Brochure Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create polished property brochures in minutes. Enter details, upload images, and export as PDF.
          </p>
        </div>
        <div className="h-[calc(100%-5rem)]">
          <BrochureWizard brochureState={brochureState} />
        </div>
      </div>
    </MainLayout>
  );
}
