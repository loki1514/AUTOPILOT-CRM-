import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BrochureState, SlideConfig, SLIDE_LABELS } from '@/types/brochure';
import { exportMultiSlideBrochure, SLIDE_WIDTH, SLIDE_HEIGHT, PDFQuality, QUALITY_SETTINGS } from '@/utils/pdfExport';
import { SlidePreview } from './SlidePreview';
import { Download, Loader2, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface BrochureFinalReviewProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  enabledSlides: SlideConfig[];
  onBack: () => void;
}

export function BrochureFinalReview({
  state,
  populatedFields,
  enabledSlides,
  onBack,
}: BrochureFinalReviewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scale, setScale] = useState(0.5);
  const [quality, setQuality] = useState<PDFQuality>('medium');
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentSlide = enabledSlides[currentSlideIndex];

  // Calculate scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = containerWidth / SLIDE_WIDTH;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: enabledSlides.length });
    try {
      const filename = state.propertyName
        ? `${state.propertyName.replace(/\s+/g, '-')}-presentation`
        : 'property-presentation';

      const slideIds = enabledSlides.map((s) => `slide-export-${s.id}`);
      await exportMultiSlideBrochure(slideIds, filename, quality, (current, total) => {
        setExportProgress({ current, total });
      });

      setExported(true);
      toast({
        title: 'PDF exported successfully',
        description: `Your presentation has been downloaded with ${enabledSlides.length} slides (${QUALITY_SETTINGS[quality].label} quality).`,
      });
      setTimeout(() => setExported(false), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error generating the PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) =>
      Math.min(enabledSlides.length - 1, prev + 1)
    );
  };

  // Helper function to get dynamic slide label (including property names for comparison slides)
  const getSlideLabel = (slide: SlideConfig) => {
    if (slide.type === 'project-showcase-property' && slide.propertyIndex !== undefined) {
      const property = state.comparisonProperties[slide.propertyIndex];
      return property?.name ? `Project Showcase - ${property.name}` : `Property ${slide.propertyIndex + 2}`;
    }
    return SLIDE_LABELS[slide.type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Final Review</h2>
          <p className="text-sm text-muted-foreground">
            Review your {enabledSlides.length}-slide presentation and export as
            PDF
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {/* Quality Selector */}
          <Select value={quality} onValueChange={(v) => setQuality(v as PDFQuality)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(QUALITY_SETTINGS).map(([key, settings]) => (
                <SelectItem key={key} value={key}>
                  {settings.label} ({settings.sizeEstimate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(exported && 'bg-green-600 hover:bg-green-600')}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Slide {exportProgress.current}/{exportProgress.total}
              </>
            ) : exported ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Export Progress Bar */}
      {isExporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Processing slides...</span>
            <span>{exportProgress.current} of {exportProgress.total}</span>
          </div>
          <Progress value={(exportProgress.current / exportProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Slide Navigator */}
      <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrevSlide}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="text-center">
          <p className="font-medium text-foreground">
            {currentSlide && getSlideLabel(currentSlide)}
          </p>
          <p className="text-sm text-muted-foreground">
            Slide {currentSlideIndex + 1} of {enabledSlides.length}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextSlide}
          disabled={currentSlideIndex === enabledSlides.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Slide Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {enabledSlides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlideIndex(index)}
            className={cn(
              'flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all',
              index === currentSlideIndex
                ? 'border-primary shadow-lg'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="w-32 aspect-[16/9] bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium px-2 text-center">
                {getSlideLabel(slide)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Current Slide Preview */}
      <div 
        ref={containerRef}
        className="rounded-2xl border border-border shadow-card overflow-hidden bg-white"
      >
        <div 
          className="relative overflow-hidden"
          style={{ height: `${SLIDE_HEIGHT * scale}px` }}
        >
          {currentSlide && (
            <div
              className="absolute top-0 left-0 origin-top-left"
              style={{
                width: `${SLIDE_WIDTH}px`,
                height: `${SLIDE_HEIGHT}px`,
                transform: `scale(${scale})`,
              }}
            >
              <SlidePreview
                state={state}
                populatedFields={populatedFields}
                slideType={currentSlide.type}
                slideConfig={currentSlide}
              />
            </div>
          )}
        </div>
      </div>

      {/* Hidden export container with all slides at full resolution */}
      <div 
        className="fixed pointer-events-none"
        style={{ left: '-9999px', top: '0' }}
        aria-hidden="true"
      >
        {enabledSlides.map((slide) => (
          <SlidePreview
            key={slide.id}
            state={state}
            populatedFields={populatedFields}
            slideType={slide.type}
            id={`slide-export-${slide.id}`}
            slideConfig={slide}
          />
        ))}
      </div>
    </div>
  );
}
