import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BrochureState } from '@/types/brochure';
import { formatINR, formatNumber } from '@/utils/pdfExport';
import { CheckCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  onConfirm: () => void;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  state,
  populatedFields,
  onConfirm,
}: ConfirmationDialogProps) {
  const filledFieldsList: { label: string; value: string }[] = [];

  if (populatedFields.propertyName) {
    filledFieldsList.push({ label: 'Property Name', value: state.propertyName });
  }
  if (populatedFields.location) {
    filledFieldsList.push({ label: 'Location', value: state.location });
  }
  if (populatedFields.googleLocationUrl) {
    filledFieldsList.push({ label: 'Google Maps', value: 'Link provided' });
  }
  if (populatedFields.carpetArea) {
    filledFieldsList.push({ label: 'Carpet Area', value: `${formatNumber(state.carpetArea!)} sqft` });
  }
  if (populatedFields.builtUpArea) {
    filledFieldsList.push({ label: 'Built-up Area', value: `${formatNumber(state.builtUpArea!)} sqft` });
  }
  if (populatedFields.totalSeats) {
    filledFieldsList.push({ label: 'Total Seats', value: formatNumber(state.totalSeats!) });
  }
  if (populatedFields.noOfFloors) {
    filledFieldsList.push({ label: 'No. of Floors', value: state.noOfFloors });
  }
  if (populatedFields.floorOffered) {
    filledFieldsList.push({ label: 'Floor Offered', value: state.floorOffered });
  }
  if (populatedFields.interiorDetails) {
    const interiorLabel = state.interiorDetails === 'bare-shell' ? 'Bare Shell' : 
                          state.interiorDetails === 'warm-shell' ? 'Warm Shell' : 'Fully Furnished';
    filledFieldsList.push({ label: 'Interior Details', value: interiorLabel });
  }
  if (populatedFields.possessionDate) {
    filledFieldsList.push({ label: 'Possession of Building', value: state.possessionDate });
  }
  if (populatedFields.rentPerSqft) {
    filledFieldsList.push({ label: 'Rent/sqft', value: formatINR(state.rentPerSqft!) });
  }
  if (populatedFields.camCharges) {
    filledFieldsList.push({ label: 'CAM Charges', value: `${formatINR(state.camCharges!)}/sqft` });
  }
  if (populatedFields.leaseTerm) {
    filledFieldsList.push({ label: 'Lease Term', value: `${state.leaseTerm} Years` });
  }
  if (populatedFields.escalation) {
    filledFieldsList.push({ label: 'Escalation', value: `${state.escalation}% p.a.` });
  }
  if (populatedFields.securityDeposit) {
    filledFieldsList.push({ label: 'Security Deposit', value: state.securityDeposit });
  }
  if (populatedFields.amenities) {
    filledFieldsList.push({ label: 'Amenities', value: `${state.amenities.length} selected` });
  }
  if (populatedFields.customFields) {
    const validCustomFields = state.customFields.filter(cf => cf.label && cf.value);
    if (validCustomFields.length > 0) {
      filledFieldsList.push({ label: 'Custom Fields', value: `${validCustomFields.length} fields` });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Data Entry</DialogTitle>
          <DialogDescription>
            Review the data you've entered before proceeding to image upload.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-y-auto py-4">
          {filledFieldsList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data entered yet. You can still proceed to add images.
            </p>
          ) : (
            <div className="space-y-2">
              {filledFieldsList.map((field, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    <p className="text-sm font-medium">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Go Back
          </Button>
          <Button onClick={onConfirm}>Continue to Images</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
