import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import { Search, PenTool, Hammer, Rocket, Settings } from 'lucide-react';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface InclusionsVisionSlideProps {
  id?: string;
  state: BrochureState;
}

const steps = [
  {
    icon: Search,
    title: 'Discovery & Strategy',
    description: 'Requirements gathering, headcount projections, and location analysis.',
    highlight: false,
  },
  {
    icon: PenTool,
    title: 'Design & Planning',
    description: 'Space planning, interior design concepts, and technical specs.',
    highlight: false,
  },
  {
    icon: Hammer,
    title: 'Build & Fit-out',
    description: 'Project management of construction, IT setup, and furniture procurement.',
    highlight: true,
  },
  {
    icon: Rocket,
    title: 'Go-Live',
    description: 'Staff onboarding, snag resolution, and operational handover.',
    highlight: false,
  },
  {
    icon: Settings,
    title: 'Managed Ops',
    description: 'Day-to-day facilities, hospitality, and tech support.',
    highlight: false,
  },
];

export function InclusionsVisionSlide({ id, state }: InclusionsVisionSlideProps) {
  return (
    <div
      id={id}
      className="relative overflow-hidden"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        background: '#FFFFFF',
        fontFamily: "'Urbanist', sans-serif",
      }}
    >
      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-[4rem]"
          style={{
            width: '400px',
            height: '400px',
            top: '-80px',
            left: '-80px',
            background: '#CF8D78',
            opacity: 0.06,
            transform: 'rotate(45deg)',
          }}
        />
        <div
          className="absolute rounded-[4rem]"
          style={{
            width: '600px',
            height: '600px',
            bottom: '-10%',
            right: '10%',
            background: '#CF8D78',
            opacity: 0.06,
            transform: 'rotate(45deg)',
          }}
        />
        <div
          className="absolute rounded-[4rem]"
          style={{
            width: '250px',
            height: '250px',
            top: '50%',
            left: '25%',
            background: '#CF8D78',
            opacity: 0.06,
            transform: 'rotate(45deg)',
          }}
        />
      </div>

      {/* Header */}
      <nav
        className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start"
        style={{ padding: '56px 64px' }}
      >
        <div className="text-left">
          <div
            className="uppercase font-bold"
            style={{
              fontSize: '12px',
              letterSpacing: '0.2em',
              color: '#9CA3AF',
            }}
          >
            Client Journey
          </div>
          <h1
            className="font-extrabold tracking-tight uppercase"
            style={{ fontSize: '36px', color: '#CF8D78' }}
          >
            From Vision to <span style={{ color: '#9CA3AF' }}>Operation</span>
          </h1>
        </div>

        <img 
          src={autopilotLogo} 
          alt="Autopilot" 
          style={{ height: '80px' }}
          className="object-contain"
        />
      </nav>

      {/* Timeline Section - Vertically Centered */}
      <main
        className="absolute left-0 right-0 z-10 flex items-center justify-center"
        style={{ 
          top: '180px',
          bottom: '160px',
          padding: '0 64px',
        }}
      >
        <div className="relative w-full" style={{ maxWidth: '1680px' }}>
          {/* Dashed Timeline Connector */}
          <div
            className="absolute"
            style={{
              top: '48px',
              left: '5%',
              right: '5%',
              height: '2px',
              background: `repeating-linear-gradient(
                to right,
                rgba(207,141,120,0.4) 0,
                rgba(207,141,120,0.4) 10px,
                transparent 10px,
                transparent 20px
              )`,
            }}
          />

          {/* Steps Grid */}
          <div
            className="grid relative z-10"
            style={{
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '48px',
            }}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center"
                >
                  <div
                    className="flex items-center justify-center rounded-2xl ring-[12px] ring-white"
                    style={{
                      width: '96px',
                      height: '96px',
                      marginBottom: '32px',
                      background: step.highlight ? '#CF8D78' : '#FFFFFF',
                      border: step.highlight ? 'none' : '1px solid rgba(207,141,120,0.12)',
                      boxShadow: step.highlight
                        ? '0 25px 50px -12px rgba(207,141,120,0.5)'
                        : '0 25px 50px -12px rgba(0,0,0,0.18)',
                    }}
                  >
                    <Icon
                      style={{
                        width: '40px',
                        height: '40px',
                        color: step.highlight ? '#FFFFFF' : '#CF8D78',
                      }}
                    />
                  </div>
                  <h3
                    className="font-bold"
                    style={{
                      fontSize: '25px',
                      marginBottom: '16px',
                      color: '#CF8D78',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '25px',
                      color: '#6B7280',
                      maxWidth: '280px',
                      lineHeight: 1.6,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 flex justify-between items-center"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '48px 64px',
          borderTop: '1px solid #F3F4F6',
        }}
      >
        <div
          className="font-medium"
          style={{ fontSize: '14px', color: '#9CA3AF' }}
        >
          Autopilot Offices © 2026
        </div>

        <div
          className="flex items-center gap-3 rounded-full"
          style={{
            background: '#F9FAFB',
            padding: '8px 20px',
          }}
        >
          <div
            className="rounded-full animate-pulse"
            style={{
              width: '8px',
              height: '8px',
              background: '#CF8D78',
            }}
          />
          <span
            className="font-bold uppercase"
            style={{
              fontSize: '12px',
              letterSpacing: '0.15em',
              color: '#4B5563',
            }}
          >
            Inclusions
          </span>
        </div>
      </footer>
    </div>
  );
}
