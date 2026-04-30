import { BrochureState } from '@/types/brochure';
import { SlideContainer } from './SlideContainer';
import { SlideHeader } from './SlideHeader';
import { MapPin, Navigation } from 'lucide-react';

interface LocationSlideProps {
  id?: string;
  state: BrochureState;
}

export function LocationSlide({ id, state }: LocationSlideProps) {
  const hasKeyDistances =
    state.keyDistances.filter((kd) => kd.place && kd.distance).length > 0;

  return (
    <SlideContainer id={id}>
      <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />

      <div className="flex flex-col h-full">
        <h2 className="text-4xl font-bold text-foreground mb-8">Location</h2>

        <div className="flex gap-12 flex-1">
          {/* Location Info */}
          <div className="w-1/2 flex flex-col justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Address
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {state.location || 'Location not specified'}
                  </p>
                </div>
              </div>

              {/* Key Distances */}
              {hasKeyDistances && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Key Distances
                  </h3>
                  <div className="space-y-3">
                    {state.keyDistances
                      .filter((kd) => kd.place && kd.distance)
                      .map((kd) => (
                        <div
                          key={kd.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                        >
                          <Navigation className="h-5 w-5 text-primary" />
                          <span className="flex-1 text-foreground">
                            {kd.place}
                          </span>
                          <span className="font-semibold text-primary">
                            {kd.distance}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Placeholder / Second Property Image */}
          <div className="w-1/2 flex items-center justify-center">
            {state.images.length > 1 ? (
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <img
                  src={state.images[1].previewUrl}
                  alt="Property View"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-[400px] rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-xl">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">Map / Location Image</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SlideContainer>
  );
}
