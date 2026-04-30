import { useState, useCallback } from 'react';
import { Property, CustomFieldData, KeyDistanceData } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AMENITIES_OPTIONS, LEASE_TERM_OPTIONS } from '@/types/brochure';
import { Plus, X, Upload, Loader2 } from 'lucide-react';
import { uploadPropertyImage } from '@/hooks/useProperties';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type PropertyFormData = Omit<Property, 'id' | 'created_at' | 'updated_at' | 'user_id'>;

interface PropertyFormProps {
  initialData?: Partial<Property>;
  propertyId?: string;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const initialFormState: PropertyFormData = {
  property_name: '',
  location: '',
  developer_name: '',
  carpet_area: null,
  built_up_area: null,
  total_seats: null,
  rent_per_sqft: null,
  cam_charges: null,
  lease_term: '',
  escalation: null,
  security_deposit: '',
  amenities: [],
  custom_fields: [],
  key_distances: [],
  images: [],
  company_name: '',
  company_tagline: '',
  company_description: '',
  company_logo_url: null,
  team_image_url: null,
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
};

export function PropertyForm({
  initialData,
  propertyId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PropertyFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PropertyFormData>({
    ...initialFormState,
    ...initialData,
  });
  const [uploadingImages, setUploadingImages] = useState(false);

  const updateField = useCallback(<K extends keyof PropertyFormData>(
    field: K,
    value: PropertyFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNumberChange = (field: keyof PropertyFormData, value: string) => {
    updateField(field, value === '' ? null : parseFloat(value) as any);
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addCustomField = () => {
    const newField: CustomFieldData = {
      id: crypto.randomUUID(),
      label: '',
      value: '',
    };
    setFormData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField],
    }));
  };

  const updateCustomField = (id: string, key: 'label' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(f =>
        f.id === id ? { ...f, [key]: value } : f
      ),
    }));
  };

  const removeCustomField = (id: string) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter(f => f.id !== id),
    }));
  };

  const addKeyDistance = () => {
    const newDistance: KeyDistanceData = {
      id: crypto.randomUUID(),
      place: '',
      distance: '',
    };
    setFormData(prev => ({
      ...prev,
      key_distances: [...prev.key_distances, newDistance],
    }));
  };

  const updateKeyDistance = (id: string, key: 'place' | 'distance', value: string) => {
    setFormData(prev => ({
      ...prev,
      key_distances: prev.key_distances.map(d =>
        d.id === id ? { ...d, [key]: value } : d
      ),
    }));
  };

  const removeKeyDistance = (id: string) => {
    setFormData(prev => ({
      ...prev,
      key_distances: prev.key_distances.filter(d => d.id !== id),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const tempId = propertyId || 'temp-' + Date.now();
    setUploadingImages(true);

    try {
      const uploadPromises = Array.from(files).map(file =>
        uploadPropertyImage(file, tempId)
      );
      const urls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...urls],
      }));
      
      toast({
        title: 'Images uploaded',
        description: `${urls.length} image(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload one or more images',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.property_name.trim()) {
      toast({
        title: 'Property name required',
        description: 'Please enter a property name',
        variant: 'destructive',
      });
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Property Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="property_name">Property Name *</Label>
            <Input
              id="property_name"
              value={formData.property_name}
              onChange={(e) => updateField('property_name', e.target.value)}
              placeholder="e.g., Prestige Tower"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location || ''}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="e.g., Whitefield, Bangalore"
            />
          </div>
          <div>
            <Label htmlFor="developer_name">Developer</Label>
            <Input
              id="developer_name"
              value={formData.developer_name || ''}
              onChange={(e) => updateField('developer_name', e.target.value)}
              placeholder="e.g., Prestige Group"
            />
          </div>
        </div>
      </div>

      {/* Commercial Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Commercial Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="carpet_area">Carpet Area (sq.ft)</Label>
            <Input
              id="carpet_area"
              type="number"
              value={formData.carpet_area ?? ''}
              onChange={(e) => handleNumberChange('carpet_area', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="built_up_area">Built-up Area (sq.ft)</Label>
            <Input
              id="built_up_area"
              type="number"
              value={formData.built_up_area ?? ''}
              onChange={(e) => handleNumberChange('built_up_area', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="total_seats">Total Seats</Label>
            <Input
              id="total_seats"
              type="number"
              value={formData.total_seats ?? ''}
              onChange={(e) => handleNumberChange('total_seats', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="rent_per_sqft">Rent per sq.ft (₹)</Label>
            <Input
              id="rent_per_sqft"
              type="number"
              value={formData.rent_per_sqft ?? ''}
              onChange={(e) => handleNumberChange('rent_per_sqft', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="cam_charges">CAM Charges (₹/sq.ft)</Label>
            <Input
              id="cam_charges"
              type="number"
              value={formData.cam_charges ?? ''}
              onChange={(e) => handleNumberChange('cam_charges', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lease_term">Lease Term</Label>
            <Select
              value={formData.lease_term || ''}
              onValueChange={(value) => updateField('lease_term', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {LEASE_TERM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="escalation">Escalation (%)</Label>
            <Input
              id="escalation"
              type="number"
              value={formData.escalation ?? ''}
              onChange={(e) => handleNumberChange('escalation', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="security_deposit">Security Deposit</Label>
            <Input
              id="security_deposit"
              value={formData.security_deposit || ''}
              onChange={(e) => updateField('security_deposit', e.target.value)}
              placeholder="e.g., 6 months rent"
            />
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Amenities
        </h3>
        <div className="flex flex-wrap gap-2">
          {AMENITIES_OPTIONS.map((amenity) => (
            <Button
              key={amenity}
              type="button"
              variant={formData.amenities.includes(amenity) ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleAmenity(amenity)}
            >
              {amenity}
            </Button>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Property Images
        </h3>
        <div className="flex flex-wrap gap-3">
          {formData.images.map((url, index) => (
            <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden group">
              <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          ))}
          <label className={cn(
            'w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors',
            uploadingImages && 'pointer-events-none opacity-50'
          )}>
            {uploadingImages ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploadingImages}
            />
          </label>
        </div>
      </div>

      {/* Key Distances */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Key Distances
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addKeyDistance}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {formData.key_distances.map((distance) => (
          <div key={distance.id} className="flex gap-2">
            <Input
              placeholder="Place (e.g., Metro Station)"
              value={distance.place}
              onChange={(e) => updateKeyDistance(distance.id, 'place', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Distance (e.g., 500m)"
              value={distance.distance}
              onChange={(e) => updateKeyDistance(distance.id, 'distance', e.target.value)}
              className="w-32"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeKeyDistance(distance.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Custom Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Custom Fields
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {formData.custom_fields.map((field) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder="Field Label"
              value={field.label}
              onChange={(e) => updateCustomField(field.id, 'label', e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="Value"
              value={field.value}
              onChange={(e) => updateCustomField(field.id, 'value', e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeCustomField(field.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Company Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Company Info (Optional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={formData.company_name || ''}
              onChange={(e) => updateField('company_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="company_tagline">Tagline</Label>
            <Input
              id="company_tagline"
              value={formData.company_tagline || ''}
              onChange={(e) => updateField('company_tagline', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="company_description">Description</Label>
            <Textarea
              id="company_description"
              value={formData.company_description || ''}
              onChange={(e) => updateField('company_description', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Contact Info (Optional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              value={formData.contact_name || ''}
              onChange={(e) => updateField('contact_name', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contact_phone">Phone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone || ''}
              onChange={(e) => updateField('contact_phone', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contact_email">Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email || ''}
              onChange={(e) => updateField('contact_email', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="contact_address">Address</Label>
            <Input
              id="contact_address"
              value={formData.contact_address || ''}
              onChange={(e) => updateField('contact_address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-background">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData?.property_name ? 'Update Property' : 'Create Property'}
        </Button>
      </div>
    </form>
  );
}
