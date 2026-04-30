import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';

import cityBangaloreIntro from '@/assets/city-bangalore-intro.png';
import cityMumbaiIntro from '@/assets/city-mumbai-intro.png';
import cityDelhiIntro from '@/assets/city-delhi-intro.png';
import cityIndoreIntro from '@/assets/city-indore-intro.png';

const CITY_BACKGROUNDS: Record<string, string> = {
  bangalore: cityBangaloreIntro,
  mumbai: cityMumbaiIntro,
  'delhi-ncr': cityDelhiIntro,
  hyderabad: cityBangaloreIntro, // Fallback to Bangalore until custom asset is added
  chennai: cityBangaloreIntro,   // Fallback to Bangalore until custom asset is added
  pune: cityBangaloreIntro,      // Fallback to Bangalore until custom asset is added
  indore: cityIndoreIntro,
};

const DEFAULT_BACKGROUND = cityBangaloreIntro;

interface IntroSlideProps {
  id?: string;
  state: BrochureState;
}

export function IntroSlide({ id, state }: IntroSlideProps) {
  // Check if selected city is a custom city with an uploaded image
  const customCity = state.customCities.find((c) => c.id === state.selectedCity);
  const customCityImage = customCity?.image?.previewUrl;
  
  // Use custom city image if available, otherwise use predefined or fallback
  const backgroundImage = customCityImage || CITY_BACKGROUNDS[state.selectedCity] || DEFAULT_BACKGROUND;

  return (
    <div
      id={id}
      className="relative overflow-hidden"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
      }}
    >
      {/* Full background image based on selected city */}
      <img
        src={backgroundImage}
        alt={`${customCity?.name || state.selectedCity} intro slide background`}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
