import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import { Brain, TrendingUp, Building2, ArrowRight } from 'lucide-react';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface HowAutopilotSlideProps {
  id?: string;
  state: BrochureState;
}

// Glass circle styling for consistent appearance
const glassCircleStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.85) 100%)',
  border: '1.5px solid rgba(207, 141, 120, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 0 30px rgba(255, 255, 255, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
};

export function HowAutopilotSlide({ id, state }: HowAutopilotSlideProps) {
  return (
    <div
      id={id}
      className="relative overflow-hidden"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        background: 'linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 50%, #F1F5F9 100%)',
        fontFamily: "'Urbanist', 'Inter', sans-serif",
      }}
    >
      {/* Logo - Top Right */}
      <img 
        src={autopilotLogo} 
        alt="Autopilot" 
        className="absolute object-contain"
        style={{
          top: '48px',
          right: '64px',
          height: '80px',
        }}
      />

      {/* Title - Centered */}
      <h2 
        className="absolute font-semibold text-gray-800"
        style={{
          top: '48px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '48px',
          letterSpacing: '-0.02em',
        }}
      >
        How Autopilot Comes Together
      </h2>

      {/* Venn Diagram Container */}
      <div 
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -45%)',
          width: '900px',
          height: '700px',
        }}
      >
        {/* HOW Circle (Top) */}
        <div
          className="absolute rounded-full"
          style={{
            ...glassCircleStyle,
            width: '380px',
            height: '380px',
            top: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
          }}
        >
          <div 
            className="absolute text-center"
            style={{
              top: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
            }}
          >
            <div 
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #CF8D78 0%, #B5533F 100%)',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(181, 83, 63, 0.3)',
              }}
            >
              <Brain className="w-7 h-7 text-white" />
            </div>
            <span 
              className="block font-bold uppercase tracking-widest"
              style={{
                fontSize: '18px',
                color: '#B5533F',
                marginBottom: '16px',
              }}
            >
              How
            </span>
            <p 
              className="font-medium leading-snug"
              style={{
                fontSize: '22px',
                color: '#1F2937',
              }}
            >
              Location Intelligence<br/>
              <span style={{ color: '#6B7280' }}>&</span> Compliance Alignment
            </p>
          </div>
        </div>

        {/* WHY Circle (Bottom Left) */}
        <div
          className="absolute rounded-full"
          style={{
            ...glassCircleStyle,
            width: '380px',
            height: '380px',
            top: '260px',
            left: '80px',
            zIndex: 10,
          }}
        >
          <div 
            className="absolute text-center"
            style={{
              bottom: '70px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
            }}
          >
            <div 
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #CF8D78 0%, #B5533F 100%)',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(181, 83, 63, 0.3)',
              }}
            >
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <span 
              className="block font-bold uppercase tracking-widest"
              style={{
                fontSize: '18px',
                color: '#B5533F',
                marginBottom: '16px',
              }}
            >
              Why
            </span>
            <p 
              className="font-medium leading-snug"
              style={{
                fontSize: '22px',
                color: '#1F2937',
              }}
            >
              Scalable Expansion<br/>
              <span style={{ color: '#6B7280' }}>&</span> Focus on Core Business
            </p>
          </div>
        </div>

        {/* WHAT Circle (Bottom Right) */}
        <div
          className="absolute rounded-full"
          style={{
            ...glassCircleStyle,
            width: '380px',
            height: '380px',
            top: '260px',
            right: '80px',
            zIndex: 10,
          }}
        >
          <div 
            className="absolute text-center"
            style={{
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '300px',
            }}
          >
            <div 
              className="mx-auto rounded-full flex items-center justify-center"
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #CF8D78 0%, #B5533F 100%)',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(181, 83, 63, 0.3)',
              }}
            >
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span 
              className="block font-bold uppercase tracking-widest"
              style={{
                fontSize: '18px',
                color: '#B5533F',
                marginBottom: '16px',
              }}
            >
              What
            </span>
            <p 
              className="font-medium leading-snug"
              style={{
                fontSize: '22px',
                color: '#1F2937',
              }}
            >
              Space Requirement Mapping<br/>
              <span style={{ color: '#6B7280' }}>&</span> Tailored Manpower Solutions
            </p>
          </div>
        </div>

        {/* Center Button - Autopilot Offices */}
        <div
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -20%)',
            zIndex: 30,
          }}
        >
          <div 
            className="flex items-center gap-3 text-white"
            style={{
              background: 'linear-gradient(135deg, #B5533F 0%, #CF8D78 100%)',
              padding: '20px 40px',
              borderRadius: '50px',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              boxShadow: '0 8px 24px rgba(181, 83, 63, 0.35)',
            }}
          >
            <span>Autopilot Offices</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        className="absolute flex justify-end items-center"
        style={{
          bottom: '48px',
          left: '64px',
          right: '64px',
          fontSize: '16px',
          color: '#6B7280',
        }}
      >
        <span>© {new Date().getFullYear()} Autopilot Offices</span>
      </div>
    </div>
  );
}
