import { BrochureState } from '@/types/brochure';
import { SlideContainer } from './SlideContainer';
import { SlideHeader } from './SlideHeader';

interface GallerySlideProps {
  id?: string;
  state: BrochureState;
}

export function GallerySlide({ id, state }: GallerySlideProps) {
  const images = state.images.slice(0, 6);

  if (images.length === 0) {
    return (
      <SlideContainer id={id}>
        <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />
        <div className="flex items-center justify-center h-full">
          <p className="text-2xl text-muted-foreground">No images uploaded</p>
        </div>
      </SlideContainer>
    );
  }

  // Different layouts based on image count
  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-2 grid-rows-2';
      default:
        return 'grid-cols-3 grid-rows-2';
    }
  };

  return (
    <SlideContainer id={id}>
      <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />

      <div className="flex flex-col h-full">
        <h2 className="text-4xl font-bold text-foreground mb-8">
          Property Gallery
        </h2>

        <div className={`grid ${getGridClass()} gap-6 flex-1`}>
          {images.map((img, index) => (
            <div
              key={img.id}
              className="rounded-2xl overflow-hidden shadow-lg bg-white"
            >
              <img
                src={img.previewUrl}
                alt={`Property ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </SlideContainer>
  );
}
