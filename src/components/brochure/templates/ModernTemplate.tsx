import { useMemo } from 'react';
import {
  MapPin,
  Grid3X3,
  LayoutGrid,
  Users,
  IndianRupee,
  Wallet,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
} from 'lucide-react';
import { BrochureState } from '@/types/brochure';
import { BrochureCard } from '../BrochureCard';
import { formatINR, formatNumber } from '@/utils/pdfExport';
import { cn } from '@/lib/utils';

interface ModernTemplateProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  fullSize?: boolean;
  id?: string;
}

export function ModernTemplate({
  state,
  populatedFields,
  fullSize = false,
  id,
}: ModernTemplateProps) {
  const hasImages = state.images.length > 0;
  const hasProjectDetails =
    populatedFields.propertyName ||
    populatedFields.location ||
    populatedFields.developerName;
  const hasCommercialDetails =
    populatedFields.carpetArea ||
    populatedFields.builtUpArea ||
    populatedFields.totalSeats ||
    populatedFields.rentPerSqft ||
    populatedFields.camCharges ||
    populatedFields.leaseTerm ||
    populatedFields.escalation ||
    populatedFields.securityDeposit;

  const isEmpty = useMemo(() => {
    return Object.keys(populatedFields).length === 0;
  }, [populatedFields]);

  if (isEmpty) {
    return (
      <div
        id={id}
        className={cn(
          'flex items-center justify-center bg-white text-muted-foreground',
          fullSize ? 'min-h-[60rem] p-12' : 'h-full p-6'
        )}
      >
        <div className="text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Start entering data to see your brochure preview</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id={id}
      className={cn('bg-white', fullSize ? 'p-12 min-h-[60rem]' : 'p-6')}
    >
      {/* Images Section */}
      {hasImages && (
        <div className="mb-8">
          {state.images.length === 1 ? (
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img
                src={state.images[0].previewUrl}
                alt="Property"
                className="w-full h-auto object-cover max-h-80"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {state.images.slice(0, 4).map((img, index) => (
                <div
                  key={img.id}
                  className={cn(
                    'rounded-xl overflow-hidden shadow-md',
                    index === 0 && state.images.length > 2 && 'col-span-2'
                  )}
                >
                  <img
                    src={img.previewUrl}
                    alt={`Property ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header Section */}
      {hasProjectDetails && (
        <div className="mb-8 text-center">
          {populatedFields.propertyName && (
            <h1
              className={cn(
                'font-bold text-foreground',
                fullSize ? 'text-3xl' : 'text-xl'
              )}
            >
              {state.propertyName}
            </h1>
          )}
          {populatedFields.location && (
            <p
              className={cn(
                'text-muted-foreground mt-1 flex items-center justify-center gap-1',
                fullSize ? 'text-lg' : 'text-sm'
              )}
            >
              <MapPin className="h-4 w-4" />
              {state.location}
            </p>
          )}
          {populatedFields.googleLocationUrl && (
            <a
              href={state.googleLocationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-primary mt-1 hover:underline inline-block',
                fullSize ? 'text-base' : 'text-xs'
              )}
            >
              View on Google Maps →
            </a>
          )}
        </div>
      )}

      {/* Commercial Details Grid */}
      {hasCommercialDetails && (
        <div
          className={cn(
            'grid gap-3 mb-8',
            fullSize ? 'grid-cols-3' : 'grid-cols-2'
          )}
        >
          {populatedFields.carpetArea && (
            <BrochureCard
              icon={Grid3X3}
              label="Carpet Area"
              value={`${formatNumber(state.carpetArea!)} sqft`}
              size={fullSize ? 'medium' : 'small'}
              variant="primary"
            />
          )}
          {populatedFields.builtUpArea && (
            <BrochureCard
              icon={LayoutGrid}
              label="Built-up Area"
              value={`${formatNumber(state.builtUpArea!)} sqft`}
              size={fullSize ? 'medium' : 'small'}
            />
          )}
          {populatedFields.totalSeats && (
            <BrochureCard
              icon={Users}
              label="Total Seats"
              value={formatNumber(state.totalSeats!)}
              size={fullSize ? 'medium' : 'small'}
              variant="primary"
            />
          )}
          {populatedFields.rentPerSqft && (
            <BrochureCard
              icon={IndianRupee}
              label="Rent / sqft"
              value={formatINR(state.rentPerSqft!)}
              size={fullSize ? 'medium' : 'small'}
            />
          )}
          {populatedFields.camCharges && (
            <BrochureCard
              icon={Wallet}
              label="CAM Charges"
              value={`${formatINR(state.camCharges!)} / sqft`}
              size={fullSize ? 'medium' : 'small'}
            />
          )}
          {populatedFields.leaseTerm && (
            <BrochureCard
              icon={Calendar}
              label="Lease Term"
              value={`${state.leaseTerm} Years`}
              size={fullSize ? 'medium' : 'small'}
            />
          )}
          {populatedFields.escalation && (
            <BrochureCard
              icon={TrendingUp}
              label="Escalation"
              value={`${state.escalation}% p.a.`}
              size={fullSize ? 'medium' : 'small'}
            />
          )}
          {populatedFields.securityDeposit && (
            <BrochureCard
              icon={Shield}
              label="Security Deposit"
              value={state.securityDeposit}
              size={fullSize ? 'medium' : 'small'}
            />
          )}
        </div>
      )}

      {/* Amenities */}
      {populatedFields.amenities && (
        <div className="mb-8">
          <h3
            className={cn(
              'font-semibold text-foreground mb-3',
              fullSize ? 'text-lg' : 'text-sm'
            )}
          >
            Amenities
          </h3>
          <div className="flex flex-wrap gap-2">
            {state.amenities.map((amenity) => (
              <span
                key={amenity}
                className={cn(
                  'rounded-full bg-primary/10 text-primary font-medium',
                  fullSize ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
                )}
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {populatedFields.customFields &&
        state.customFields.filter((cf) => cf.label && cf.value).length > 0 && (
          <div>
            <h3
              className={cn(
                'font-semibold text-foreground mb-3',
                fullSize ? 'text-lg' : 'text-sm'
              )}
            >
              Additional Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {state.customFields
                .filter((cf) => cf.label && cf.value)
                .map((cf) => (
                  <div
                    key={cf.id}
                    className="rounded-xl border border-border bg-muted/30 p-3"
                  >
                    <p className="text-[0.625rem] uppercase tracking-wider text-muted-foreground font-medium">
                      {cf.label}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {cf.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  );
}
