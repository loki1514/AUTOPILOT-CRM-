import { BrochureState, SlideType, SlideConfig } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import {
  IntroSlide,
  AboutCompanySlide,
  ProjectDetailsSlide,
  ThankYouSlide,
  HowAutopilotSlide,
  ProjectShowcaseSlide,
  MultiPropertyComparisonSlide,
  InclusionsVisionSlide,
  InclusionsExclusionsSlide,
} from './slides';

interface SlidePreviewProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  slideType: SlideType;
  id?: string;
  slideConfig?: SlideConfig;
}

export function SlidePreview({
  state,
  populatedFields,
  slideType,
  id,
  slideConfig,
}: SlidePreviewProps) {
  const renderSlide = () => {
    switch (slideType) {
      case 'intro':
        return <IntroSlide id={id} state={state} />;
      case 'about-company':
        return <AboutCompanySlide id={id} state={state} />;
      case 'how-autopilot':
        return <HowAutopilotSlide id={id} state={state} />;
      case 'project-details':
        return <ProjectDetailsSlide id={id} state={state} />;
      case 'project-showcase':
        return <ProjectShowcaseSlide id={id} state={state} />;
      case 'project-showcase-property':
        return <ProjectShowcaseSlide id={id} state={state} propertyIndex={slideConfig?.propertyIndex} />;
      case 'multi-property-comparison':
        return <MultiPropertyComparisonSlide id={id} state={state} />;
      case 'inclusions-vision':
        return <InclusionsVisionSlide id={id} state={state} />;
      case 'inclusions-exclusions':
        return <InclusionsExclusionsSlide id={id} state={state} />;
      case 'thank-you':
        return <ThankYouSlide id={id} state={state} />;
      default:
        return (
          <ProjectDetailsSlide
            id={id}
            state={state}
            populatedFields={populatedFields}
          />
        );
    }
  };

  // Render the slide at full size - parent handles scaling
  return (
    <div
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
      }}
    >
      {renderSlide()}
    </div>
  );
}

interface MultiSlideRendererProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  enabledSlides: SlideConfig[];
}

export function MultiSlideRenderer({
  state,
  populatedFields,
  enabledSlides,
}: MultiSlideRendererProps) {
  return (
    <div className="space-y-4">
      {enabledSlides.map((slide, index) => (
        <div
          key={slide.id}
          id={`slide-${slide.id}`}
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
          }}
        >
          <SlidePreview
            state={state}
            populatedFields={populatedFields}
            slideType={slide.type}
            id={`slide-export-${slide.id}`}
            slideConfig={slide}
          />
        </div>
      ))}
    </div>
  );
}
