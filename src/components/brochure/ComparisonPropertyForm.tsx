import { useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ComparisonProperty,
  AMENITIES_OPTIONS,
  LEASE_TERM_OPTIONS,
  INTERIOR_DETAILS_OPTIONS,
  YES_NO_OPTIONS,
  LIGHTING_OPTIONS,
  SECURITY_POSTURE_OPTIONS,
  InteriorDetails,
} from '@/types/brochure';
import { BrochureStateActions } from '@/hooks/useBrochureState';
import {
  X,
  Building2,
  DollarSign,
  Sparkles,
  ChevronDown,
  Upload,
  MapPin,
  ImageIcon,
  Plus,
  Settings2,
  Zap,
  Shield,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonPropertyFormProps {
  property: ComparisonProperty;
  index: number;
  actions: BrochureStateActions;
}

export function ComparisonPropertyForm({
  property,
  index,
  actions,
}: ComparisonPropertyFormProps) {
  const {
    updateComparisonProperty,
    removeComparisonProperty,
    addComparisonPropertyImage,
    removeComparisonPropertyImage,
    toggleComparisonPropertyAmenity,
    addComparisonPropertyCustomField,
    updateComparisonPropertyCustomField,
    removeComparisonPropertyCustomField,
    setComparisonPropertyComplianceProof,
  } = actions;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const complianceFileInputRef = useRef<HTMLInputElement>(null);

  const handleNumberChange = (field: keyof ComparisonProperty, value: string) => {
    const num = value === '' ? null : parseFloat(value);
    updateComparisonProperty(property.id, field, num as any);
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        Array.from(files).forEach((file) => {
          if (file.type.startsWith('image/')) {
            addComparisonPropertyImage(property.id, file);
          }
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [property.id, addComparisonPropertyImage]
  );

  const handleComplianceFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setComparisonPropertyComplianceProof(property.id, file);
      }
      if (complianceFileInputRef.current) {
        complianceFileInputRef.current.value = '';
      }
    },
    [property.id, setComparisonPropertyComplianceProof]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          addComparisonPropertyImage(property.id, file);
        }
      });
    },
    [property.id, addComparisonPropertyImage]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base">Property {index + 2}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => removeComparisonProperty(property.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Project Details */}
      <Collapsible defaultOpen className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Project Details
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input
                placeholder="e.g., Property B"
                value={property.name}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'name', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Whitefield, Bangalore"
                value={property.location}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'location', e.target.value)
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Google Maps Link
              </Label>
              <Input
                type="url"
                placeholder="e.g., https://maps.google.com/..."
                value={property.googleLocationUrl}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'googleLocationUrl', e.target.value)
                }
              />
              {property.googleLocationUrl && (
                <a
                  href={property.googleLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Open in Google Maps →
                </a>
              )}
            </div>
            <div className="space-y-2">
              <Label>Super Buildup Area (sqft)</Label>
              <Input
                type="number"
                placeholder="e.g., 8000"
                value={property.superBuiltUpArea ?? ''}
                onChange={(e) => handleNumberChange('superBuiltUpArea', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Floor No(s)</Label>
              <Input
                type="text"
                placeholder="e.g., 3rd, 4th, 5th"
                value={property.floorNumbers}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'floorNumbers', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Contiguous</Label>
              <Select
                value={property.contiguous}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'contiguous', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Possession Today</Label>
              <Input
                type="text"
                placeholder="e.g., Yes - Available immediately"
                value={property.possessionToday}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'possessionToday', e.target.value)
                }
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Commercial Details */}
      <Collapsible defaultOpen className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Commercial Details
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Carpet Area (sqft)</Label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={property.carpetArea ?? ''}
                onChange={(e) => handleNumberChange('carpetArea', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Built-up Area (sqft)</Label>
              <Input
                type="number"
                placeholder="e.g., 7000"
                value={property.builtUpArea ?? ''}
                onChange={(e) => handleNumberChange('builtUpArea', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Seats</Label>
              <Input
                type="number"
                placeholder="e.g., 100"
                value={property.totalSeats ?? ''}
                onChange={(e) => handleNumberChange('totalSeats', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>No. of Floors</Label>
              <Input
                type="text"
                placeholder="e.g., G+5"
                value={property.noOfFloors}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'noOfFloors', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Floor Offered</Label>
              <Input
                type="text"
                placeholder="e.g., 3rd Floor"
                value={property.floorOffered}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'floorOffered', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Interior Details</Label>
              <Select
                value={property.interiorDetails}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'interiorDetails', value as InteriorDetails)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERIOR_DETAILS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Possession of Building</Label>
              <Input
                type="text"
                placeholder="e.g., March 2025"
                value={property.possessionDate}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'possessionDate', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Rent per sqft (₹)</Label>
              <Input
                type="number"
                placeholder="e.g., 85"
                value={property.rentPerSqft ?? ''}
                onChange={(e) => handleNumberChange('rentPerSqft', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>CAM Charges (₹/sqft)</Label>
              <Input
                type="number"
                placeholder="e.g., 25"
                value={property.camCharges ?? ''}
                onChange={(e) => handleNumberChange('camCharges', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Lease Term</Label>
              <Select
                value={property.leaseTerm}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'leaseTerm', value)
                }
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
            <div className="space-y-2">
              <Label>Escalation (% p.a.)</Label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={property.escalation ?? ''}
                onChange={(e) => handleNumberChange('escalation', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Security Deposit</Label>
              <Input
                placeholder="e.g., 6 months rent"
                value={property.securityDeposit}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'securityDeposit', e.target.value)
                }
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Amenities */}
      <Collapsible className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Amenities
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="flex flex-wrap gap-2">
            {AMENITIES_OPTIONS.map((amenity) => {
              const isSelected = property.amenities.includes(amenity);
              return (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleComparisonPropertyAmenity(property.id, amenity)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {amenity}
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* MEP Section */}
      <Collapsible className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            MEP
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Sanctioned Load (kW)</Label>
              <Input
                type="text"
                placeholder="e.g., 500 kW"
                value={property.mepSanctionedLoad}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'mepSanctionedLoad', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>DG Backup (%)</Label>
              <Input
                type="text"
                placeholder="e.g., 100%"
                value={property.mepDgBackup}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'mepDgBackup', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>HVAC Type</Label>
              <Input
                type="text"
                placeholder="e.g., VRF / Centralized"
                value={property.mepHvacType}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'mepHvacType', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>HVAC Operating Hours</Label>
              <Input
                type="text"
                placeholder="e.g., 9 AM - 9 PM"
                value={property.mepHvacOperatingHours}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'mepHvacOperatingHours', e.target.value)
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Night Restrictions</Label>
              <Input
                type="text"
                placeholder="e.g., Yes - No music after 10 PM"
                value={property.mepNightRestrictions}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'mepNightRestrictions', e.target.value)
                }
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Compliance Section */}
      <Collapsible className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Compliance
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>OC Status</Label>
              <Input
                type="text"
                placeholder="e.g., Received"
                value={property.complianceOcStatus}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'complianceOcStatus', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Fire NOC Status</Label>
              <Input
                type="text"
                placeholder="e.g., Applied"
                value={property.complianceFireNocStatus}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'complianceFireNocStatus', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Lift License Status</Label>
              <Input
                type="text"
                placeholder="e.g., Valid till 2025"
                value={property.complianceLiftLicenseStatus}
                onChange={(e) =>
                  updateComparisonProperty(property.id, 'complianceLiftLicenseStatus', e.target.value)
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label>Compliance Proof</Label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => complianceFileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {property.complianceProof ? property.complianceProof.file.name : 'Click to upload'}
                    </p>
                    <input
                      ref={complianceFileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleComplianceFileSelect}
                    />
                  </div>
                  {property.complianceProof && (
                    <div className="mt-2 flex items-center gap-2">
                      {property.complianceProof.file.type.startsWith('image/') && (
                        <img
                          src={property.complianceProof.previewUrl}
                          alt="Compliance proof"
                          className="h-16 w-16 object-cover rounded-md"
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setComparisonPropertyComplianceProof(property.id, null)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Input
                    placeholder="Notes (e.g., Document reference)"
                    value={property.complianceProofNotes}
                    onChange={(e) =>
                      updateComparisonProperty(property.id, 'complianceProofNotes', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Night Shift Section */}
      <Collapsible className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Night Shift
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Approach Road Lighting</Label>
              <Select
                value={property.nightShiftApproachRoadLighting}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'nightShiftApproachRoadLighting', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {LIGHTING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Security Posture</Label>
              <Select
                value={property.nightShiftSecurityPosture}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'nightShiftSecurityPosture', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_POSTURE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Separate Entry for Night Shift</Label>
              <Select
                value={property.nightShiftSeparateEntry}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'nightShiftSeparateEntry', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cab Pickup Space</Label>
              <Select
                value={property.nightShiftCabPickupSpace}
                onValueChange={(value) =>
                  updateComparisonProperty(property.id, 'nightShiftCabPickupSpace', value as any)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {YES_NO_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Custom Fields */}
      <Collapsible className="mb-4">
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Custom Fields
            {property.customFields.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({property.customFields.length})
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="space-y-3">
            {property.customFields.map((field) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Label (e.g., Parking Slots)"
                    value={field.label}
                    onChange={(e) =>
                      updateComparisonPropertyCustomField(property.id, field.id, 'label', e.target.value)
                    }
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Input
                    placeholder="Value (e.g., 50)"
                    value={field.value}
                    onChange={(e) =>
                      updateComparisonPropertyCustomField(property.id, field.id, 'value', e.target.value)
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => removeComparisonPropertyCustomField(property.id, field.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addComparisonPropertyCustomField(property.id)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Field
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Property Images */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Property Images
            {property.images.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({property.images.length})
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          {/* Upload Zone */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to upload
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Image Thumbnails */}
          {property.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {property.images.map((image) => (
                <div key={image.id} className="relative group aspect-square">
                  <img
                    src={image.previewUrl}
                    alt="Property"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeComparisonPropertyImage(property.id, image.id)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
