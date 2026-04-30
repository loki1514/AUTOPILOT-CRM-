import { BrochureState } from '@/types/brochure';
import { SlideContainer } from './SlideContainer';
import { SlideHeader } from './SlideHeader';
import {
  IndianRupee,
  Calendar,
  TrendingUp,
  Shield,
  FileText,
  Building2,
  Wallet,
} from 'lucide-react';
import { formatINR, formatNumber } from '@/utils/pdfExport';
import { LucideIcon } from 'lucide-react';

interface TermsSlideProps {
  id?: string;
  state: BrochureState;
  populatedFields: Record<string, boolean>;
}

interface TermRowProps {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
}

function TermRow({ icon: Icon, iconColor, iconBg, label, value }: TermRowProps) {
  return (
    <div className="flex items-center gap-6 bg-white rounded-2xl shadow-sm p-6">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-7 w-7" style={{ color: iconColor }} />
      </div>
      <div className="flex-1">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function TermsSlide({ id, state, populatedFields }: TermsSlideProps) {
  const terms: Array<{
    key: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string;
  }> = [];

  if (populatedFields.carpetArea) {
    terms.push({
      key: 'carpet',
      icon: Building2,
      iconColor: '#3b82f6',
      iconBg: '#dbeafe',
      label: 'Carpet Area',
      value: `${formatNumber(state.carpetArea!)} sqft`,
    });
  }

  if (populatedFields.builtUpArea) {
    terms.push({
      key: 'builtup',
      icon: Building2,
      iconColor: '#8b5cf6',
      iconBg: '#ede9fe',
      label: 'Built-up Area',
      value: `${formatNumber(state.builtUpArea!)} sqft`,
    });
  }

  if (populatedFields.rentPerSqft) {
    terms.push({
      key: 'rent',
      icon: IndianRupee,
      iconColor: '#22c55e',
      iconBg: '#dcfce7',
      label: 'Rent per sqft',
      value: formatINR(state.rentPerSqft!),
    });
  }

  if (populatedFields.camCharges) {
    terms.push({
      key: 'cam',
      icon: Wallet,
      iconColor: '#f97316',
      iconBg: '#ffedd5',
      label: 'CAM Charges',
      value: `${formatINR(state.camCharges!)} / sqft`,
    });
  }

  if (populatedFields.leaseTerm) {
    terms.push({
      key: 'lease',
      icon: Calendar,
      iconColor: '#6366f1',
      iconBg: '#e0e7ff',
      label: 'Lease Term',
      value: `${state.leaseTerm} Years`,
    });

    terms.push({
      key: 'lockin',
      icon: FileText,
      iconColor: '#14b8a6',
      iconBg: '#ccfbf1',
      label: 'Lock-in Period',
      value: `${state.leaseTerm} Years`,
    });
  }

  if (populatedFields.escalation) {
    terms.push({
      key: 'escalation',
      icon: TrendingUp,
      iconColor: '#f97316',
      iconBg: '#ffedd5',
      label: 'Annual Escalation',
      value: `${state.escalation}%`,
    });
  }

  if (populatedFields.securityDeposit) {
    terms.push({
      key: 'security',
      icon: Shield,
      iconColor: '#22c55e',
      iconBg: '#dcfce7',
      label: 'Security Deposit',
      value: state.securityDeposit,
    });
  }

  return (
    <SlideContainer id={id}>
      <SlideHeader companyName={state.companyName || 'AUTOPILOT'} />

      <div className="flex flex-col h-full">
        <h2 className="text-4xl font-bold text-foreground mb-8">
          Terms & Conditions
        </h2>

        {terms.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {terms.map((term) => (
              <TermRow
                key={term.key}
                icon={term.icon}
                iconColor={term.iconColor}
                iconBg={term.iconBg}
                label={term.label}
                value={term.value}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-2xl text-muted-foreground">
              No commercial terms specified
            </p>
          </div>
        )}
      </div>
    </SlideContainer>
  );
}
