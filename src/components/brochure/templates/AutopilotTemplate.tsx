import { useMemo } from 'react';
import {
  MapPin,
  Building2,
  Users,
  Wifi,
  Armchair,
  Link,
  ClipboardList,
  ShieldCheck,
  Shield,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { BrochureState } from '@/types/brochure';
import { formatINR, formatNumber } from '@/utils/pdfExport';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface AutopilotTemplateProps {
  state: BrochureState;
  populatedFields: Record<string, boolean>;
  fullSize?: boolean;
  id?: string;
}

interface InfoCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  fullSize?: boolean;
}

function InfoCard({ icon: Icon, iconColor, iconBg, label, value, fullSize }: InfoCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl shadow-md flex flex-col items-center text-center',
        fullSize ? 'p-5' : 'p-3'
      )}
    >
      <div
        className={cn(
          'rounded-xl flex items-center justify-center mb-2',
          fullSize ? 'w-12 h-12' : 'w-8 h-8'
        )}
        style={{ backgroundColor: iconBg }}
      >
        <Icon className={cn(fullSize ? 'h-6 w-6' : 'h-4 w-4')} style={{ color: iconColor }} />
      </div>
      <p
        className={cn(
          'text-muted-foreground font-medium mb-1',
          fullSize ? 'text-sm' : 'text-[0.6rem]'
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'font-bold text-foreground leading-tight',
          fullSize ? 'text-base' : 'text-xs'
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function AutopilotTemplate({
  state,
  populatedFields,
  fullSize = false,
  id,
}: AutopilotTemplateProps) {
  const hasImages = state.images.length > 0;

  const isEmpty = useMemo(() => {
    return Object.keys(populatedFields).length === 0;
  }, [populatedFields]);

  // Build info cards array based on populated fields
  const infoCards = useMemo(() => {
    const cards: Array<{
      key: string;
      icon: LucideIcon;
      iconColor: string;
      iconBg: string;
      label: string;
      value: string;
    }> = [];

    if (populatedFields.location) {
      cards.push({
        key: 'location',
        icon: MapPin,
        iconColor: '#22c55e',
        iconBg: '#dcfce7',
        label: 'Location',
        value: state.location,
      });
    }

    if (populatedFields.carpetArea || populatedFields.builtUpArea) {
      cards.push({
        key: 'area',
        icon: Building2,
        iconColor: '#3b82f6',
        iconBg: '#dbeafe',
        label: 'Total Floor Area',
        value: `${formatNumber(state.carpetArea || state.builtUpArea || 0)} Sq.ft`,
      });
    }

    if (populatedFields.totalSeats) {
      cards.push({
        key: 'seats',
        icon: Users,
        iconColor: '#a855f7',
        iconBg: '#f3e8ff',
        label: 'Total Seats',
        value: `${formatNumber(state.totalSeats!)} Seats`,
      });
    }

    if (populatedFields.rentPerSqft) {
      cards.push({
        key: 'perSeatCharges',
        icon: Wifi,
        iconColor: '#22c55e',
        iconBg: '#dcfce7',
        label: 'Per Seat Charges',
        value: formatINR(state.rentPerSqft!),
      });
    }

    if (populatedFields.camCharges) {
      cards.push({
        key: 'perSeat',
        icon: Armchair,
        iconColor: '#8b5cf6',
        iconBg: '#ede9fe',
        label: 'Per Seat',
        value: formatINR(state.camCharges!),
      });
    }

    // Second row
    if (populatedFields.leaseTerm) {
      cards.push({
        key: 'lockin',
        icon: Link,
        iconColor: '#22c55e',
        iconBg: '#dcfce7',
        label: 'Lock-in Period',
        value: `${state.leaseTerm} Years`,
      });

      cards.push({
        key: 'leaseTerm',
        icon: ClipboardList,
        iconColor: '#10b981',
        iconBg: '#d1fae5',
        label: 'Lease Term',
        value: `${state.leaseTerm} Years`,
      });
    }

    if (populatedFields.securityDeposit) {
      cards.push({
        key: 'securityDeposit',
        icon: ShieldCheck,
        iconColor: '#22c55e',
        iconBg: '#dcfce7',
        label: 'Security Deposit',
        value: state.securityDeposit,
      });

      cards.push({
        key: 'depositMonths',
        icon: Shield,
        iconColor: '#3b82f6',
        iconBg: '#dbeafe',
        label: 'Deposit Months',
        value: state.securityDeposit,
      });
    }

    if (populatedFields.escalation) {
      cards.push({
        key: 'escalation',
        icon: TrendingUp,
        iconColor: '#f97316',
        iconBg: '#ffedd5',
        label: 'Yearly Escalation',
        value: `${state.escalation}%`,
      });
    }

    return cards;
  }, [populatedFields, state]);

  if (isEmpty) {
    return (
      <div
        id={id}
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 text-muted-foreground',
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
        'relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50',
        fullSize ? 'p-12 min-h-[60rem]' : 'p-4'
      )}
    >
      {/* Decorative swirls */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-32 h-32 bg-gradient-to-l from-orange-200/20 to-transparent rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2
              className={cn(
                'font-bold text-foreground',
                fullSize ? 'text-3xl' : 'text-lg'
              )}
            >
              Project Details
            </h2>
            {populatedFields.propertyName && (
              <p
                className={cn(
                  'text-muted-foreground mt-1',
                  fullSize ? 'text-xl' : 'text-sm'
                )}
              >
                {state.propertyName}
              </p>
            )}
          </div>

          {/* Logo placeholder */}
          <div
            className={cn(
              'rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 text-white font-bold flex items-center justify-center',
              fullSize ? 'px-4 py-2 text-sm' : 'px-2 py-1 text-[0.5rem]'
            )}
          >
            AUTOPILOT
          </div>
        </div>

        {/* Property Image */}
        {hasImages && (
          <div className="mb-8">
            <div
              className={cn(
                'relative rounded-3xl overflow-hidden',
                'ring-4 ring-offset-2',
                fullSize ? 'ring-offset-4' : ''
              )}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #14b8a6, #eab308, #f97316)',
                padding: fullSize ? '4px' : '2px',
              }}
            >
              <div className="rounded-[calc(1.5rem-4px)] overflow-hidden bg-white">
                <img
                  src={state.images[0].previewUrl}
                  alt="Property"
                  className={cn(
                    'w-full object-cover',
                    fullSize ? 'max-h-[24rem]' : 'max-h-32'
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Cards Grid */}
        {infoCards.length > 0 && (
          <div
            className={cn(
              'grid gap-3',
              fullSize ? 'grid-cols-5' : 'grid-cols-5'
            )}
          >
            {infoCards.map((card) => (
              <InfoCard
                key={card.key}
                icon={card.icon}
                iconColor={card.iconColor}
                iconBg={card.iconBg}
                label={card.label}
                value={card.value}
                fullSize={fullSize}
              />
            ))}
          </div>
        )}

        {/* Amenities */}
        {populatedFields.amenities && (
          <div className={cn('mt-6', fullSize ? '' : '')}>
            <h3
              className={cn(
                'font-semibold text-foreground mb-3',
                fullSize ? 'text-lg' : 'text-xs'
              )}
            >
              Amenities
            </h3>
            <div className="flex flex-wrap gap-2">
              {state.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className={cn(
                    'rounded-full bg-white shadow-sm border border-border/50 font-medium text-foreground',
                    fullSize ? 'px-4 py-1.5 text-sm' : 'px-2 py-0.5 text-[0.5rem]'
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
                  'font-semibold text-foreground mb-3',
                  fullSize ? 'text-lg' : 'text-xs'
                )}
              >
                Additional Details
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {state.customFields
                  .filter((cf) => cf.label && cf.value)
                  .map((cf) => (
                    <div
                      key={cf.id}
                      className={cn(
                        'rounded-xl bg-white shadow-sm border border-border/50',
                        fullSize ? 'p-4' : 'p-2'
                      )}
                    >
                      <p
                        className={cn(
                          'text-muted-foreground font-medium',
                          fullSize ? 'text-xs' : 'text-[0.5rem]'
                        )}
                      >
                        {cf.label}
                      </p>
                      <p
                        className={cn(
                          'font-semibold text-foreground',
                          fullSize ? 'text-sm' : 'text-[0.6rem]'
                        )}
                      >
                        {cf.value}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
