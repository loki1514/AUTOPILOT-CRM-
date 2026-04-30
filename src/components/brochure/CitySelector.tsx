import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { BrochureCity, CustomCity, CITY_OPTIONS } from '@/types/brochure';
import { ArrowRight, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import cityBangaloreIntro from '@/assets/city-bangalore-intro.png';
import cityMumbaiIntro from '@/assets/city-mumbai-intro.png';
import cityDelhiIntro from '@/assets/city-delhi-intro.png';
import cityIndoreIntro from '@/assets/city-indore-intro.png';

const CITY_IMAGES: Record<string, string> = {
  bangalore: cityBangaloreIntro,
  mumbai: cityMumbaiIntro,
  'delhi-ncr': cityDelhiIntro,
  hyderabad: cityBangaloreIntro, // Fallback until custom asset is added
  chennai: cityBangaloreIntro,   // Fallback until custom asset is added
  pune: cityBangaloreIntro,      // Fallback until custom asset is added
  indore: cityIndoreIntro,
};

interface CitySelectorProps {
  selectedCity: BrochureCity;
  onSelectCity: (city: BrochureCity) => void;
  onContinue: () => void;
  customCities: CustomCity[];
}

export function CitySelector({
  selectedCity,
  onSelectCity,
  onContinue,
  customCities,
}: CitySelectorProps) {
  // Combine predefined and custom cities with their images
  const allCities = [
    ...CITY_OPTIONS.map((c) => ({ ...c, customImage: null as string | null })),
    ...customCities.map((c) => ({ 
      id: c.id, 
      name: c.name, 
      description: c.description,
      customImage: c.image?.previewUrl || null,
    })),
  ];

  const getSelectedCityName = () => {
    const city = allCities.find((c) => c.id === selectedCity);
    return city?.name || 'this city';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your City</h2>
        <p className="text-muted-foreground">
          Select the city for your property brochure. Each city has a unique intro slide design.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allCities.map((city) => {
          const isCustom = city.id.startsWith('custom-');
          const backgroundImage = city.customImage || CITY_IMAGES[city.id] || cityBangaloreIntro;
          const hasImage = !isCustom || city.customImage;

          return (
            <Card
              key={city.id}
              className={cn(
                'cursor-pointer transition-all duration-200 hover:shadow-lg overflow-hidden',
                selectedCity === city.id
                  ? 'ring-2 ring-primary shadow-lg'
                  : 'hover:ring-1 hover:ring-primary/50'
              )}
              onClick={() => onSelectCity(city.id)}
            >
              <div className="relative">
                <AspectRatio ratio={16 / 9}>
                  {hasImage ? (
                    <img
                      src={backgroundImage}
                      alt={`${city.name} intro slide`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                </AspectRatio>
                {selectedCity === city.id && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1.5">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                {isCustom && (
                  <div className="absolute top-3 left-3 bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                    Custom
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{city.name}</h3>
                <p className="text-sm text-muted-foreground">{city.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-center pt-4">
        <Button onClick={onContinue} size="lg">
          Continue with {getSelectedCityName()}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
