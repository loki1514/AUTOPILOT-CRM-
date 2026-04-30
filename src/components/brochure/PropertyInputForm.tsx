import { useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BrochureState, 
  AMENITIES_OPTIONS, 
  LEASE_TERM_OPTIONS, 
  INTERIOR_DETAILS_OPTIONS,
  YES_NO_OPTIONS,
  LIGHTING_OPTIONS,
  SECURITY_POSTURE_OPTIONS,
} from '@/types/brochure';
import { BrochureStateActions } from '@/hooks/useBrochureState';
import { Plus, X, Building2, DollarSign, Sparkles, Users, Phone, Layers, MapPin, Zap, Shield, Moon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonPropertyForm } from './ComparisonPropertyForm';

interface PropertyInputFormProps {
  state: BrochureState;
  actions: BrochureStateActions;
}

export function PropertyInputForm({ state, actions }: PropertyInputFormProps) {
  const { 
    updateField, 
    toggleAmenity, 
    addCustomField, 
    updateCustomField, 
    removeCustomField,
    addComparisonProperty,
    updateComparisonProperty,
    removeComparisonProperty,
    setComplianceProof,
  } = actions;

  const complianceFileInputRef = useRef<HTMLInputElement>(null);

  const handleNumberChange = (field: keyof BrochureState, value: string) => {
    const num = value === '' ? null : parseFloat(value);
    updateField(field, num as any);
  };

  const handleComplianceFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setComplianceProof(file);
      }
      if (complianceFileInputRef.current) {
        complianceFileInputRef.current.value = '';
      }
    },
    [setComplianceProof]
  );

  return (
    <div className="space-y-8">
      {/* Project Details */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Project Details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="propertyName">Property Name</Label>
            <Input
              id="propertyName"
              placeholder="e.g., Prestige Tech Park"
              value={state.propertyName}
              onChange={(e) => updateField('propertyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Outer Ring Road, Bangalore"
              value={state.location}
              onChange={(e) => updateField('location', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="googleLocationUrl" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Google Maps Link
            </Label>
            <Input
              id="googleLocationUrl"
              type="url"
              placeholder="e.g., https://maps.google.com/..."
              value={state.googleLocationUrl}
              onChange={(e) => updateField('googleLocationUrl', e.target.value)}
            />
            {state.googleLocationUrl && (
              <a 
                href={state.googleLocationUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Open in Google Maps →
              </a>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="superBuiltUpArea">Super Buildup Area (sqft)</Label>
            <Input
              id="superBuiltUpArea"
              type="number"
              placeholder="e.g., 8000"
              value={state.superBuiltUpArea ?? ''}
              onChange={(e) => handleNumberChange('superBuiltUpArea', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floorNumbers">Floor No(s)</Label>
            <Input
              id="floorNumbers"
              type="text"
              placeholder="e.g., 3rd, 4th, 5th"
              value={state.floorNumbers}
              onChange={(e) => updateField('floorNumbers', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contiguous">Contiguous</Label>
            <Select value={state.contiguous} onValueChange={(value) => updateField('contiguous', value as any)}>
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
            <Label htmlFor="possessionToday">Possession Today</Label>
            <Input
              id="possessionToday"
              type="text"
              placeholder="e.g., Yes - Available immediately"
              value={state.possessionToday}
              onChange={(e) => updateField('possessionToday', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Company Details */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Company Details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="e.g., Autopilot Offices"
              value={state.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyTagline">Tagline</Label>
            <Input
              id="companyTagline"
              placeholder="e.g., Your Workspace Partner"
              value={state.companyTagline}
              onChange={(e) => updateField('companyTagline', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="companyDescription">Company Description</Label>
            <Textarea
              id="companyDescription"
              placeholder="Brief description about your company..."
              value={state.companyDescription}
              onChange={(e) => updateField('companyDescription', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Contact Details */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Contact Details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Person</Label>
            <Input
              id="contactName"
              placeholder="e.g., John Doe"
              value={state.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone</Label>
            <Input
              id="contactPhone"
              placeholder="e.g., +91 98765 43210"
              value={state.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="e.g., contact@company.com"
              value={state.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactAddress">Address</Label>
            <Input
              id="contactAddress"
              placeholder="e.g., 123 Business Park, City"
              value={state.contactAddress}
              onChange={(e) => updateField('contactAddress', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Commercial Details */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <DollarSign className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Commercial Details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="carpetArea">Carpet Area (sqft)</Label>
            <Input
              id="carpetArea"
              type="number"
              placeholder="e.g., 5000"
              value={state.carpetArea ?? ''}
              onChange={(e) => handleNumberChange('carpetArea', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="builtUpArea">Built-up Area (sqft)</Label>
            <Input
              id="builtUpArea"
              type="number"
              placeholder="e.g., 7000"
              value={state.builtUpArea ?? ''}
              onChange={(e) => handleNumberChange('builtUpArea', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalSeats">Total Seats</Label>
            <Input
              id="totalSeats"
              type="number"
              placeholder="e.g., 100"
              value={state.totalSeats ?? ''}
              onChange={(e) => handleNumberChange('totalSeats', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="noOfFloors">No. of Floors</Label>
            <Input
              id="noOfFloors"
              type="text"
              placeholder="e.g., G+5 or 3 Floors"
              value={state.noOfFloors}
              onChange={(e) => updateField('noOfFloors', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="floorOffered">Floor Offered</Label>
            <Input
              id="floorOffered"
              type="text"
              placeholder="e.g., 3rd Floor or Ground + 1st"
              value={state.floorOffered}
              onChange={(e) => updateField('floorOffered', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interiorDetails">Interior Details</Label>
            <Select value={state.interiorDetails} onValueChange={(value) => updateField('interiorDetails', value as any)}>
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
            <Label htmlFor="possessionDate">Possession of Building</Label>
            <Input
              id="possessionDate"
              type="text"
              placeholder="e.g., March 2025"
              value={state.possessionDate}
              onChange={(e) => updateField('possessionDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rentPerSqft">Rent per sqft (₹)</Label>
            <Input
              id="rentPerSqft"
              type="number"
              placeholder="e.g., 85"
              value={state.rentPerSqft ?? ''}
              onChange={(e) => handleNumberChange('rentPerSqft', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camCharges">CAM Charges (₹/sqft)</Label>
            <Input
              id="camCharges"
              type="number"
              placeholder="e.g., 25"
              value={state.camCharges ?? ''}
              onChange={(e) => handleNumberChange('camCharges', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leaseTerm">Lease Term</Label>
            <Select value={state.leaseTerm} onValueChange={(value) => updateField('leaseTerm', value)}>
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
            <Label htmlFor="escalation">Escalation (% p.a.)</Label>
            <Input
              id="escalation"
              type="number"
              placeholder="e.g., 5"
              value={state.escalation ?? ''}
              onChange={(e) => handleNumberChange('escalation', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="securityDeposit">Security Deposit</Label>
            <Input
              id="securityDeposit"
              placeholder="e.g., 6 months rent"
              value={state.securityDeposit}
              onChange={(e) => updateField('securityDeposit', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Amenities</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {AMENITIES_OPTIONS.map((amenity) => {
            const isSelected = state.amenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-all',
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
      </section>

      {/* MEP Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">MEP</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="mepSanctionedLoad">Sanctioned Load (kW)</Label>
            <Input
              id="mepSanctionedLoad"
              type="text"
              placeholder="e.g., 500 kW"
              value={state.mepSanctionedLoad}
              onChange={(e) => updateField('mepSanctionedLoad', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mepDgBackup">DG Backup (%)</Label>
            <Input
              id="mepDgBackup"
              type="text"
              placeholder="e.g., 100%"
              value={state.mepDgBackup}
              onChange={(e) => updateField('mepDgBackup', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mepHvacType">HVAC Type</Label>
            <Input
              id="mepHvacType"
              type="text"
              placeholder="e.g., VRF / Centralized"
              value={state.mepHvacType}
              onChange={(e) => updateField('mepHvacType', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mepHvacOperatingHours">HVAC Operating Hours</Label>
            <Input
              id="mepHvacOperatingHours"
              type="text"
              placeholder="e.g., 9 AM - 9 PM"
              value={state.mepHvacOperatingHours}
              onChange={(e) => updateField('mepHvacOperatingHours', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="mepNightRestrictions">Night Restrictions</Label>
            <Input
              id="mepNightRestrictions"
              type="text"
              placeholder="e.g., Yes - No music after 10 PM"
              value={state.mepNightRestrictions}
              onChange={(e) => updateField('mepNightRestrictions', e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Compliance</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="complianceOcStatus">OC Status</Label>
            <Input
              id="complianceOcStatus"
              type="text"
              placeholder="e.g., Received"
              value={state.complianceOcStatus}
              onChange={(e) => updateField('complianceOcStatus', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complianceFireNocStatus">Fire NOC Status</Label>
            <Input
              id="complianceFireNocStatus"
              type="text"
              placeholder="e.g., Applied"
              value={state.complianceFireNocStatus}
              onChange={(e) => updateField('complianceFireNocStatus', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complianceLiftLicenseStatus">Lift License Status</Label>
            <Input
              id="complianceLiftLicenseStatus"
              type="text"
              placeholder="e.g., Valid till 2025"
              value={state.complianceLiftLicenseStatus}
              onChange={(e) => updateField('complianceLiftLicenseStatus', e.target.value)}
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
                    {state.complianceProof ? state.complianceProof.file.name : 'Click to upload compliance proof'}
                  </p>
                  <input
                    ref={complianceFileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleComplianceFileSelect}
                  />
                </div>
                {state.complianceProof && (
                  <div className="mt-2 flex items-center gap-2">
                    {state.complianceProof.file.type.startsWith('image/') && (
                      <img
                        src={state.complianceProof.previewUrl}
                        alt="Compliance proof"
                        className="h-16 w-16 object-cover rounded-md"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setComplianceProof(null)}
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
                  value={state.complianceProofNotes}
                  onChange={(e) => updateField('complianceProofNotes', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Night Shift Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Moon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Night Shift</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="nightShiftApproachRoadLighting">Approach Road Lighting</Label>
            <Select value={state.nightShiftApproachRoadLighting} onValueChange={(value) => updateField('nightShiftApproachRoadLighting', value as any)}>
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
            <Label htmlFor="nightShiftSecurityPosture">Security Posture</Label>
            <Select value={state.nightShiftSecurityPosture} onValueChange={(value) => updateField('nightShiftSecurityPosture', value as any)}>
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
            <Label htmlFor="nightShiftSeparateEntry">Separate Entry for Night Shift</Label>
            <Select value={state.nightShiftSeparateEntry} onValueChange={(value) => updateField('nightShiftSeparateEntry', value as any)}>
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
            <Label htmlFor="nightShiftCabPickupSpace">Cab Pickup Space</Label>
            <Select value={state.nightShiftCabPickupSpace} onValueChange={(value) => updateField('nightShiftCabPickupSpace', value as any)}>
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
      </section>

      {/* Custom Fields */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Custom Fields</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
        </div>
        {state.customFields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add custom fields for any additional property details.</p>
        ) : (
          <div className="space-y-3">
            {state.customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-3">
                <Input
                  placeholder="Label"
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
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(field.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Comparison Properties */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Comparison Properties</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addComparisonProperty}>
            <Plus className="h-4 w-4 mr-1" />
            Add Property
          </Button>
        </div>
        {state.comparisonProperties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add additional properties to compare in the Multi-Property Comparison slide.
          </p>
        ) : (
          <div className="space-y-6">
            {state.comparisonProperties.map((property, index) => (
              <ComparisonPropertyForm
                key={property.id}
                property={property}
                index={index}
                actions={actions}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
