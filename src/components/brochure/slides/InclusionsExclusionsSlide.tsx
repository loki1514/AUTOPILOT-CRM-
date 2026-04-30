import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import { 
  Building2, 
  Clock, 
  Zap, 
  Wrench, 
  Battery, 
  CheckCircle2, 
  Car, 
  Lock, 
  Flame,
  User,
  Bell,
  Video,
  Droplets,
  ShieldCheck,
  Users,
  SprayCan
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface InclusionsExclusionsSlideProps {
  id?: string;
  state: BrochureState;
}

interface InclusionItem {
  icon: LucideIcon;
  text: string;
}

const capexItems: InclusionItem[] = [
  { icon: Building2, text: 'Infrastructure – as per client requirement' },
  { icon: Clock, text: '24/7 Working days & Office accessibility' },
  { icon: Zap, text: 'CAM Electricity & water consumption' },
  { icon: Wrench, text: 'Common area Maintenance' },
  { icon: Battery, text: 'UPS & DG backup – 100% Backup' },
  { icon: CheckCircle2, text: 'Compliant as per industry standards' },
  { icon: Car, text: 'Parking – As per developers offerings' },
  { icon: Lock, text: 'Designated office space with full privacy' },
  { icon: Flame, text: 'Fire Safety' },
];

const opexItems: InclusionItem[] = [
  { icon: User, text: 'Site-in-charge (Administration)' },
  { icon: Bell, text: 'Reception & Visitor Management Service' },
  { icon: Video, text: 'CCTV with 100% coverage & 30 days back up' },
  { icon: SprayCan, text: 'Washroom & cafeteria housekeeping with consumables' },
  { icon: Droplets, text: 'Drinking Water' },
  { icon: ShieldCheck, text: 'Security services' },
  { icon: Users, text: 'Manpower – Technicians, BMS Sup, Plumber, Carpenter' },
  { icon: SprayCan, text: 'Inhouse housekeeping services' },
];

function InclusionRow({ icon: Icon, text }: InclusionItem) {
  return (
    <div className="flex items-start">
      <div
        className="flex items-center justify-center rounded-xl mr-5 flex-shrink-0"
        style={{
          background: 'rgba(207,141,120,0.10)',
          padding: '12px',
        }}
      >
        <Icon
          style={{
            width: '24px',
            height: '24px',
            color: '#CF8D78',
          }}
        />
      </div>
      <p
        className="border-b w-full"
        style={{
          fontSize: '18px',
          color: '#334155',
          paddingBottom: '8px',
          borderColor: '#E2E8F0',
          lineHeight: 1.5,
        }}
      >
        {text}
      </p>
    </div>
  );
}

export function InclusionsExclusionsSlide({ id, state }: InclusionsExclusionsSlideProps) {
  return (
    <div
      id={id}
      className="relative overflow-hidden flex flex-col"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        background: '#FFFFFF',
        fontFamily: "'Urbanist', sans-serif",
        padding: '72px 80px 80px',
        boxSizing: 'border-box',
      }}
    >
      {/* Decorative Elements */}
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-140px',
          right: '-140px',
          width: '460px',
          height: '460px',
          background: 'radial-gradient(circle, rgba(207,141,120,0.12) 0%, rgba(207,141,120,0) 70%)',
        }}
      />
      <div
        className="absolute rounded-bl-full"
        style={{
          top: 0,
          right: 0,
          width: '288px',
          height: '288px',
          background: 'rgba(207,141,120,0.05)',
        }}
      />

      {/* Header */}
      <div className="flex justify-between items-start relative z-10" style={{ marginBottom: '56px' }}>
        <div
          className="border-2 px-10 py-3"
          style={{ borderColor: '#CF8D78' }}
        >
          <h1
            className="font-extrabold uppercase"
            style={{
              fontSize: '32px',
              letterSpacing: '0.25em',
              color: '#0F172A',
            }}
          >
            THE INCLUSIONS ARE
          </h1>
        </div>

        <img 
          src={autopilotLogo} 
          alt="Autopilot" 
          style={{ height: '80px' }}
          className="object-contain"
        />
      </div>

      {/* Content Grid */}
      <div
        className="grid flex-grow relative z-10"
        style={{
          gridTemplateColumns: '1fr 1fr',
          gap: '96px',
        }}
      >
        {/* CAPEX Column */}
        <div>
          <h2
            className="font-bold"
            style={{
              fontSize: '48px',
              marginBottom: '32px',
              color: '#0F172A',
            }}
          >
            CAPEX
          </h2>
          <div className="flex flex-col" style={{ gap: '20px' }}>
            {capexItems.map((item, index) => (
              <InclusionRow key={index} icon={item.icon} text={item.text} />
            ))}
          </div>
        </div>

        {/* OPEX Column */}
        <div>
          <h2
            className="font-bold"
            style={{
              fontSize: '48px',
              marginBottom: '32px',
              color: '#0F172A',
            }}
          >
            OPEX
          </h2>
          <div className="flex flex-col" style={{ gap: '20px' }}>
            {opexItems.map((item, index) => (
              <InclusionRow key={index} icon={item.icon} text={item.text} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end relative z-10" style={{ marginTop: '48px' }}>
        <div
          style={{
            height: '4px',
            width: '128px',
            background: '#CF8D78',
          }}
        />
        <div
          className="uppercase"
          style={{
            color: '#94A3B8',
            fontSize: '14px',
            letterSpacing: '0.15em',
          }}
        >
          Premium Workspace Solutions
        </div>
      </div>
    </div>
  );
}
