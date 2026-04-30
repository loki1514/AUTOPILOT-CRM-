import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BrochureCity, BrochureImage, CustomCity, CITY_OPTIONS } from '@/types/brochure';
import { Settings, Upload, X, MapPin, Image, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrochureSettingsProps {
  selectedCity: BrochureCity;
  onSelectCity: (city: BrochureCity) => void;
  thumbnail: BrochureImage | null;
  onSetThumbnail: (file: File | null) => void;
  customCities: CustomCity[];
  onAddCustomCity: (name: string, description: string, image: File | null) => string;
  onUpdateCustomCityImage: (cityId: string, image: File | null) => void;
  onRemoveCustomCity: (id: string) => void;
}

export function BrochureSettings({
  selectedCity,
  onSelectCity,
  thumbnail,
  onSetThumbnail,
  customCities,
  onAddCustomCity,
  onUpdateCustomCityImage,
  onRemoveCustomCity,
}: BrochureSettingsProps) {
  const [open, setOpen] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityDescription, setNewCityDescription] = useState('');
  const [newCityImage, setNewCityImage] = useState<File | null>(null);
  const [newCityImagePreview, setNewCityImagePreview] = useState<string | null>(null);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSetThumbnail(file);
    }
  };

  const handleRemoveThumbnail = () => {
    onSetThumbnail(null);
  };

  const handleNewCityImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewCityImage(file);
      setNewCityImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveNewCityImage = () => {
    if (newCityImagePreview) {
      URL.revokeObjectURL(newCityImagePreview);
    }
    setNewCityImage(null);
    setNewCityImagePreview(null);
  };

  const handleAddCity = () => {
    if (newCityName.trim()) {
      onAddCustomCity(newCityName.trim(), newCityDescription.trim() || 'Custom City', newCityImage);
      setNewCityName('');
      setNewCityDescription('');
      if (newCityImagePreview) {
        URL.revokeObjectURL(newCityImagePreview);
      }
      setNewCityImage(null);
      setNewCityImagePreview(null);
    }
  };

  const handleCustomCityImageUpload = (cityId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpdateCustomCityImage(cityId, file);
    }
  };

  // Combine predefined and custom cities for the dropdown
  const allCities = [
    ...CITY_OPTIONS,
    ...customCities.map((c) => ({ id: c.id, name: c.name, description: c.description })),
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Brochure Settings</SheetTitle>
          <SheetDescription>
            Configure global settings for your brochure
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* City Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">City</Label>
            </div>
            <Select value={selectedCity} onValueChange={(value) => onSelectCity(value as BrochureCity)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a city" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {allCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    <div className="flex flex-col">
                      <span>{city.name}</span>
                      <span className="text-xs text-muted-foreground">{city.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              This determines the intro and thank you slide backgrounds
            </p>
          </div>

          {/* Add Custom City */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Add Custom City</Label>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">City Name</Label>
                <Input
                  placeholder="e.g., Kolkata"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <Input
                  placeholder="e.g., City of Joy"
                  value={newCityDescription}
                  onChange={(e) => setNewCityDescription(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              {/* City Background Image */}
              <div>
                <Label className="text-sm text-muted-foreground">Background Image (Optional)</Label>
                {newCityImagePreview ? (
                  <div className="relative mt-1 rounded-lg overflow-hidden border border-border">
                    <img
                      src={newCityImagePreview}
                      alt="City background preview"
                      className="w-full h-24 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={handleRemoveNewCityImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label
                    className={cn(
                      'flex flex-col items-center justify-center w-full h-24 mt-1',
                      'border-2 border-dashed border-muted-foreground/25 rounded-lg',
                      'cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors'
                    )}
                  >
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload city background</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewCityImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              
              <Button
                onClick={handleAddCity}
                disabled={!newCityName.trim()}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add City
              </Button>
            </div>
          </div>

          {customCities.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Your Custom Cities</Label>
              <div className="space-y-3">
                {customCities.map((city) => (
                  <div
                    key={city.id}
                    className="p-3 rounded-lg border border-border bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{city.name}</p>
                        <p className="text-sm text-muted-foreground">{city.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveCustomCity(city.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* City Image */}
                    {city.image ? (
                      <div className="relative rounded-lg overflow-hidden border border-border">
                        <img
                          src={city.image.previewUrl}
                          alt={`${city.name} background`}
                          className="w-full h-20 object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => onUpdateCustomCityImage(city.id, null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        className={cn(
                          'flex items-center justify-center gap-2 w-full h-12',
                          'border border-dashed border-muted-foreground/25 rounded-lg',
                          'cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors'
                        )}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Add background image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCustomCityImageUpload(city.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thumbnail Upload */}
          <div className="space-y-3 border-t border-border pt-6">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-medium">Brochure Thumbnail</Label>
            </div>
            
            {thumbnail ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={thumbnail.previewUrl}
                  alt="Brochure thumbnail"
                  className="w-full h-48 object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveThumbnail}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label
                className={cn(
                  'flex flex-col items-center justify-center w-full h-48',
                  'border-2 border-dashed border-muted-foreground/25 rounded-lg',
                  'cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors'
                )}
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">Click to upload thumbnail</span>
                <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-sm text-muted-foreground">
              This image will be used as the brochure cover thumbnail
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
