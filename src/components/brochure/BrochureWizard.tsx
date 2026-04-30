import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrochureStateActions } from '@/hooks/useBrochureState';
import { CitySelector } from './CitySelector';
import { TemplateSelector } from './TemplateSelector';
import { SlideConfigurator } from './SlideConfigurator';
import { PropertyInputForm } from './PropertyInputForm';
import { ImageUploadStep } from './ImageUploadStep';
import { BrochureFinalReview } from './BrochureFinalReview';
import { SlidePreview } from './SlidePreview';
import { ConfirmationDialog } from './ConfirmationDialog';
import { BrochureSettings } from './BrochureSettings';
import { ArrowRight, ArrowLeft, Check, Palette, Layout, FileText, Image, Eye, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrochureWizardProps {
  brochureState: BrochureStateActions;
}

const steps = [
  { number: 0, label: 'City', icon: MapPin },
  { number: 1, label: 'Template', icon: Palette },
  { number: 2, label: 'Slides', icon: Layout },
  { number: 3, label: 'Content', icon: FileText },
  { number: 4, label: 'Images', icon: Image },
  { number: 5, label: 'Review', icon: Eye },
];

export function BrochureWizard({ brochureState }: BrochureWizardProps) {
  const { state, populatedFields, enabledSlides, nextStep, prevStep, setStep, setTemplate, setCity, setThumbnail, addCustomCity, updateCustomCityImage, removeCustomCity } = brochureState;
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleNextFromStep2 = () => {
    setShowConfirmation(true);
  };

  const handleConfirmStep2 = () => {
    setShowConfirmation(false);
    nextStep();
  };

  const handleNextFromStep3 = () => {
    nextStep();
  };

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header with Settings Button */}
          <div className="flex justify-end mb-4">
            <BrochureSettings
              selectedCity={state.selectedCity}
              onSelectCity={setCity}
              thumbnail={state.thumbnail}
              onSetThumbnail={setThumbnail}
              customCities={state.customCities}
              onAddCustomCity={addCustomCity}
              onUpdateCustomCityImage={updateCustomCityImage}
              onRemoveCustomCity={removeCustomCity}
            />
          </div>

          {/* Step Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <button
                    onClick={() => {
                      if (step.number < state.currentStep) {
                        setStep(step.number as 0 | 1 | 2 | 3 | 4 | 5);
                      }
                    }}
                    disabled={step.number > state.currentStep}
                    className={cn(
                      'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
                      step.number === state.currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.number < state.currentStep
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {step.number < state.currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <step.icon className="h-4 w-4" />
                    )}
                    <span className="hidden lg:inline">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 w-4 lg:w-8 mx-1 lg:mx-2',
                        step.number < state.currentStep
                          ? 'bg-primary'
                          : 'bg-muted'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          {state.currentStep === 0 && (
            <CitySelector
              selectedCity={state.selectedCity}
              onSelectCity={setCity}
              onContinue={nextStep}
              customCities={state.customCities}
            />
          )}

          {state.currentStep === 1 && (
            <TemplateSelector
              selectedTemplate={state.selectedTemplate}
              onSelectTemplate={setTemplate}
              onContinue={nextStep}
            />
          )}

          {state.currentStep === 2 && (
            <div className="space-y-6">
              <SlideConfigurator
                state={state}
                actions={brochureState}
                onContinue={nextStep}
              />
            </div>
          )}

          {state.currentStep === 3 && (
            <div className="space-y-6">
              <PropertyInputForm state={state} actions={brochureState} />
              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNextFromStep2}>
                  Next: Add Images
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {state.currentStep === 4 && (
            <div className="space-y-6">
              <ImageUploadStep state={state} actions={brochureState} />
              <div className="flex justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNextFromStep3}>
                  Review & Export
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {state.currentStep === 5 && (
            <BrochureFinalReview
              state={state}
              populatedFields={populatedFields}
              enabledSlides={enabledSlides}
              onBack={prevStep}
            />
          )}
        </div>
      </div>

      {/* Live Preview Sidebar (steps 2 & 3) */}
      {(state.currentStep === 3 || state.currentStep === 4) && (
        <div className="hidden xl:block w-[32rem] border-l border-border bg-muted/30 p-6 overflow-auto">
          <div className="sticky top-0">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">
              Live Preview (16:9)
            </h3>
            <div className="rounded-2xl border border-border bg-white shadow-card overflow-hidden">
              <div className="aspect-[16/9] overflow-hidden">
                <SlidePreview
                  state={state}
                  populatedFields={populatedFields}
                  slideType="project-details"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        state={state}
        populatedFields={populatedFields}
        onConfirm={handleConfirmStep2}
      />
    </div>
  );
}
