import { BrochureState } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import aboutCompanyBg from '@/assets/about-company-bg.svg';

interface AboutCompanySlideProps {
  id?: string;
  state: BrochureState;
}

export function AboutCompanySlide({ id, state }: AboutCompanySlideProps) {
  return (
    <div
      id={id}
      className="relative overflow-hidden"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
      }}
    >
      {/* SVG Background */}
      <img
        src={aboutCompanyBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
