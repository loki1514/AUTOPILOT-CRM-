import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import {
  MapPin,
  Layers,
  Users,
  Calendar,
  Shield,
  TrendingUp,
  Lock,
  Settings,
} from 'lucide-react';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface MultiPropertyComparisonSlideProps {
  id?: string;
  state: BrochureState;
}

interface PropertyData {
  name: string;
  location: string | null;
  floorArea: number | null;
  totalSeats: number | null;
  leaseTerm: string | null;
  securityDeposit: string | null;
  escalation: number | null;
  lockInPeriod: string | null;
}

interface ComparisonRowProps {
  icon: React.ElementType;
  label: string;
  values: (string | null)[];
  bestIndex?: number;
}

function formatValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

function ComparisonRow({ icon: Icon, label, values, bestIndex = 1 }: ComparisonRowProps) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-5 px-6 font-medium text-slate-800 flex items-center gap-3" style={{ fontSize: '25px' }}>
        <Icon className="text-slate-400" size={20} />
        {label}
      </td>
      {values.map((value, index) => (
        <td
          key={index}
          className={`py-5 px-6 text-center ${
            index === bestIndex
              ? 'font-semibold text-slate-900 bg-teal-50/50'
              : 'text-slate-600'
          }`}
          style={{ fontSize: '25px' }}
        >
          {formatValue(value)}
        </td>
      ))}
    </tr>
  );
}

export function MultiPropertyComparisonSlide({ id, state }: MultiPropertyComparisonSlideProps) {
  // Main property from state
  const mainProperty: PropertyData = {
    name: state.propertyName || 'Property A',
    location: state.location || null,
    floorArea: state.builtUpArea,
    totalSeats: state.totalSeats,
    leaseTerm: state.leaseTerm ? `${state.leaseTerm} Months` : null,
    securityDeposit: state.securityDeposit || null,
    escalation: state.escalation,
    lockInPeriod: state.leaseTerm ? `${Math.floor(parseInt(state.leaseTerm) / 12)} Years` : null,
  };

  // Additional comparison properties from state
  const comparisonProperties: PropertyData[] = state.comparisonProperties.map((cp) => ({
    name: cp.name || 'Unnamed Property',
    location: cp.location || null,
    floorArea: cp.builtUpArea,
    totalSeats: cp.totalSeats,
    leaseTerm: cp.leaseTerm ? `${cp.leaseTerm} Months` : null,
    securityDeposit: cp.securityDeposit || null,
    escalation: cp.escalation,
    lockInPeriod: cp.leaseTerm ? `${Math.floor(parseInt(cp.leaseTerm) / 12)} Years` : null,
  }));

  // Combine main property with comparison properties (max 4 columns for layout)
  const properties: PropertyData[] = [mainProperty, ...comparisonProperties].slice(0, 4);

  const rows = [
    {
      icon: MapPin,
      label: 'Location',
      values: properties.map((p) => p.location),
    },
    {
      icon: Layers,
      label: 'Total Floor Area',
      values: properties.map((p) => (p.floorArea ? `${p.floorArea.toLocaleString()} sqft` : null)),
    },
    {
      icon: Users,
      label: 'Total Seats',
      values: properties.map((p) => (p.totalSeats ? `${p.totalSeats}` : null)),
    },
    {
      icon: Calendar,
      label: 'Lease Term',
      values: properties.map((p) => p.leaseTerm),
    },
    {
      icon: Shield,
      label: 'Security Deposit',
      values: properties.map((p) => p.securityDeposit),
    },
    {
      icon: TrendingUp,
      label: 'Yearly Escalation',
      values: properties.map((p) => (p.escalation ? `${p.escalation}%` : null)),
    },
    {
      icon: Lock,
      label: 'Lock-in Period',
      values: properties.map((p) => p.lockInPeriod),
    },
    {
      icon: Settings,
      label: 'Technology Suite',
      values: properties.map(() => 'Full Integrated System'),
    },
  ];

  return (
    <div
      id={id}
      className="relative overflow-hidden"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Urbanist', sans-serif",
      }}
    >
      {/* Header */}
      <div className="px-16 pt-12 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 uppercase mb-2">
              Multi-Property Comparison
            </h1>
            <p className="text-slate-500 text-lg">
              Premium Enterprise Managed Office Workspace Solutions
            </p>
          </div>
          <img 
            src={autopilotLogo} 
            alt="Autopilot" 
            style={{ height: '80px' }}
            className="object-contain"
          />
        </div>
      </div>

      {/* Comparison Table */}
      <div className="mx-16 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-50">
              <th className="py-5 px-6 w-1/5"></th>
              {properties.map((property, index) => (
                <th
                  key={index}
                  className={`py-5 px-6 text-center relative ${
                    index === 1 ? 'bg-teal-50/50' : ''
                  }`}
                >
                  {index === 1 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-[10px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full whitespace-nowrap z-20 shadow-md">
                      Best-Fit Choice
                    </div>
                  )}
                  <span
                    className={`text-lg ${
                      index === 1
                        ? 'font-bold text-slate-900'
                        : 'font-semibold text-slate-700'
                    }`}
                  >
                    {property.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <ComparisonRow
                key={index}
                icon={row.icon}
                label={row.label}
                values={row.values}
                bestIndex={1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-16 py-6">
        <p className="text-sm text-slate-400 font-medium">
          Autopilot Offices | Managed Workspace Solutions
        </p>
        <p className="text-sm text-slate-400 font-medium tracking-widest">
          07 / 10
        </p>
      </div>
    </div>
  );
}
