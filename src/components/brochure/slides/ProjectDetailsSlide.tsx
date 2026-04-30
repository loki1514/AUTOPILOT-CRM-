import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface ProjectDetailsSlideProps {
  id?: string;
  state: BrochureState;
  populatedFields?: Record<string, boolean>;
}

export function ProjectDetailsSlide({
  id,
  state,
}: ProjectDetailsSlideProps) {
  const companyName = state.companyName || 'AUTOPILOT';
  const currentYear = new Date().getFullYear();

  return (
    <div
      id={id}
      className="relative overflow-hidden bg-white"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        fontFamily: "'Urbanist', sans-serif",
      }}
    >
      {/* Logo - Top Right */}
      <img 
        src={autopilotLogo} 
        alt="Autopilot" 
        className="absolute object-contain z-10"
        style={{
          top: '48px',
          right: '64px',
          height: '80px',
        }}
      />

      {/* Decorative blob - top right */}
      <div
        className="absolute"
        style={{
          top: '-80px',
          right: '-120px',
          width: '600px',
          height: '500px',
          background: '#F5E6DC',
          borderRadius: '60% 40% 50% 50%',
          transform: 'rotate(-15deg)',
        }}
      />

      {/* Decorative blob - bottom right */}
      <div
        className="absolute"
        style={{
          bottom: '-150px',
          right: '100px',
          width: '450px',
          height: '400px',
          background: '#F5E6DC',
          borderRadius: '50% 50% 40% 60%',
          transform: 'rotate(10deg)',
        }}
      />

      {/* Main content - centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Accent line */}
        <div
          className="mb-6"
          style={{
            width: '80px',
            height: '4px',
            background: '#B5533F',
          }}
        />

        {/* Main title */}
        <h1
          className="text-center font-black uppercase leading-none"
          style={{
            fontSize: '140px',
            color: '#000',
            letterSpacing: '-0.02em',
            lineHeight: '0.9',
          }}
        >
          PROJECT
          <br />
          DETAILS
        </h1>

        <p
          className="mt-12 text-center uppercase font-semibold"
          style={{
            fontSize: '24px',
            color: '#B5533F',
            letterSpacing: '0.15em',
          }}
        >
          SCALE PREMIUM MANAGED
        </p>
      </div>

      {/* Footer section */}
      <div className="absolute bottom-12 left-12 right-12 flex items-end justify-end">

        {/* Copyright */}
        <p
          className="text-sm"
          style={{ color: '#B5533F' }}
        >
          © {currentYear} Autopilot Offices. Confidential.
        </p>
      </div>
    </div>
  );
}
