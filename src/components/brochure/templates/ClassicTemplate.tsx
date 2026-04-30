import { useMemo } from 'react';
import {
  MapPin,
  Building2,
  Users,
  IndianRupee,
  Calendar,
  TrendingUp,
  Shield,
  Sparkles,
} from 'lucide-react';
import { BrochureState } from '@/types/brochure';
import { formatINR, formatNumber } from '@/utils/pdfExport';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ClassicTemplateProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  fullSize?: boolean;
  id?: string;
}

interface DetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  fullSize?: boolean;
}

function DetailRow({ icon: Icon, label, value, fullSize }: DetailRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border/50 last:border-0',
        fullSize ? 'py-4' : 'py-2'
      )}
    >
      <div
        className={cn(
          'rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0',
          fullSize ? 'w-10 h-10' : 'w-6 h-6'
        )}
      >
        <Icon
          className={cn('text-purple-600', fullSize ? 'h-5 w-5' : 'h-3 w-3')}
        />
      </div>
      <div className="flex-1">
        <p
          className={cn(
            'text-muted-foreground',
            fullSize ? 'text-sm' : 'text-[0.6rem]'
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            'font-bold text-foreground',
            fullSize ? 'text-lg' : 'text-xs'
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export function ClassicTemplate({
  state,
  populatedFields,
  fullSize = false,
  id,
}: ClassicTemplateProps) {
  const hasImages = state.images.length > 0;

  const isEmpty = useMemo(() => {
    return Object.keys(populatedFields).length === 0;
  }, [populatedFields]);

  if (isEmpty) {
    return (
      <div
        id={id}
        className={cn(
          'flex items-center justify-center bg-slate-50 text-muted-foreground',
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
      className={cn(
        'relative overflow-hidden bg-slate-50',
        fullSize ? 'p-12 min-h-[60rem]' : 'p-4'
      )}
    >
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/30 rounded-bl-[100px]" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100/40 rounded-tr-[80px]" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className={cn('mb-6', fullSize ? '' : '')}>
          {populatedFields.propertyName && (
            <h1
              className={cn(
                'font-bold text-foreground',
                fullSize ? 'text-4xl' : 'text-xl'
              )}
            >
              {state.propertyName}
            </h1>
          )}
          {populatedFields.location && (
            <p
              className={cn(
                'text-muted-foreground mt-2 flex items-center gap-1',
                fullSize ? 'text-xl' : 'text-sm'
              )}
            >
              <MapPin className={cn(fullSize ? 'h-5 w-5' : 'h-3 w-3')} />
              {state.location}
            </p>
          )}
          {populatedFields.googleLocationUrl && (
            <a
              href={state.googleLocationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-purple-600 font-medium mt-1 hover:underline inline-block',
                fullSize ? 'text-lg' : 'text-xs'
              )}
            >
              View on Google Maps →
            </a>
          )}
        </div>

        {/* Image */}
        {hasImages && (
          <div className="mb-6">
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src={state.images[0].previewUrl}
                alt="Property"
                className={cn(
                  'w-full object-cover',
                  fullSize ? 'max-h-[20rem]' : 'max-h-24'
                )}
              />
            </div>
          </div>
        )}

        {/* Details Grid - Two columns */}
        <div className={cn('grid gap-6', fullSize ? 'grid-cols-2' : 'grid-cols-1')}>
          {/* Left Column */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3
              className={cn(
                'font-bold text-foreground mb-4 pb-2 border-b border-border',
                fullSize ? 'text-lg' : 'text-sm'
              )}
            >
              Property Details
            </h3>
            <div className="space-y-0">
              {populatedFields.carpetArea && (
                <DetailRow
                  icon={Building2}
                  label="Carpet Area"
                  value={`${formatNumber(state.carpetArea!)} sqft`}
                  fullSize={fullSize}
                />
              )}
              {populatedFields.builtUpArea && (
                <DetailRow
                  icon={Building2}
                  label="Built-up Area"
                  value={`${formatNumber(state.builtUpArea!)} sqft`}
                  fullSize={fullSize}
                />
              )}
              {populatedFields.totalSeats && (
                <DetailRow
                  icon={Users}
                  label="Total Seats"
                  value={formatNumber(state.totalSeats!)}
                  fullSize={fullSize}
                />
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3
              className={cn(
                'font-bold text-foreground mb-4 pb-2 border-b border-border',
                fullSize ? 'text-lg' : 'text-sm'
              )}
            >
              Commercial Terms
            </h3>
            <div className="space-y-0">
              {populatedFields.rentPerSqft && (
                <DetailRow
                  icon={IndianRupee}
                  label="Rent per sqft"
                  value={formatINR(state.rentPerSqft!)}
                  fullSize={fullSize}
                />
              )}
              {populatedFields.leaseTerm && (
                <DetailRow
                  icon={Calendar}
                  label="Lease Term"
                  value={`${state.leaseTerm} Years`}
                  fullSize={fullSize}
                />
              )}
              {populatedFields.escalation && (
                <DetailRow
                  icon={TrendingUp}
                  label="Escalation"
                  value={`${state.escalation}% p.a.`}
                  fullSize={fullSize}
                />
              )}
              {populatedFields.securityDeposit && (
                <DetailRow
                  icon={Shield}
                  label="Security Deposit"
                  value={state.securityDeposit}
                  fullSize={fullSize}
                />
              )}
            </div>
          </div>
        </div>

        {/* Amenities */}
        {populatedFields.amenities && (
          <div className={cn('mt-6', fullSize ? '' : '')}>
            <h3
              className={cn(
                'font-bold text-foreground mb-3',
                fullSize ? 'text-lg' : 'text-sm'
              )}
            >
              Amenities & Features
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className={cn(
                    'rounded-lg bg-white shadow-sm border border-purple-200 text-foreground font-medium',
                    fullSize ? 'px-4 py-2 text-sm' : 'px-2 py-1 text-[0.6rem]'
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
            <div className={cn('mt-6', fullSize ? '' : '')}>
              <h3
                className={cn(
                  'font-bold text-foreground mb-3',
                  fullSize ? 'text-lg' : 'text-sm'
                )}
              >
                Additional Information
              </h3>
              <div className="bg-white rounded-2xl shadow-sm p-4">
                {state.customFields
                  .filter((cf) => cf.label && cf.value)
                  .map((cf) => (
                    <DetailRow
                      key={cf.id}
                      icon={Building2}
                      label={cf.label}
                      value={cf.value}
                      fullSize={fullSize}
                    />
                  ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
