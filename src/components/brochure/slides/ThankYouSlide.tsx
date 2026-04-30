import { BrochureState, BrochureCity } from '@/types/brochure';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import { Phone, Mail, User } from 'lucide-react';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface ThankYouSlideProps {
  id?: string;
  state: BrochureState;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

interface ContactCardProps {
  name: string;
  phone: string;
  email: string;
  accentColor: string;
}

// City-specific contact configuration
const CITY_CONTACTS: Record<string, ContactInfo[]> = {
  bangalore: [
    { name: 'Madhavi Jain', phone: '+91 99119 36066', email: 'madhvi.jain@worksquare.in' },
    { name: 'Saniel Golechha', phone: '+91 98206 45092', email: 'Saniel@worksquare.in' },
  ],
  mumbai: [
    { name: 'Shubham Gavali', phone: '+91 9619427089', email: 'shubham.gavali@worksquare.in' },
    { name: 'Mehul Kapadia', phone: '+91 9833237615', email: 'mehul.kapadia@worksquare.in' },
  ],
  'delhi-ncr': [
    { name: 'Madhavi Jain', phone: '+91 99119 36066', email: 'madhvi.jain@worksquare.in' },
    { name: 'Saniel Golechha', phone: '+91 98206 45092', email: 'Saniel@worksquare.in' },
  ],
  hyderabad: [
    { name: 'Madhavi Jain', phone: '+91 99119 36066', email: 'madhvi.jain@worksquare.in' },
    { name: 'Saniel Golechha', phone: '+91 98206 45092', email: 'Saniel@worksquare.in' },
  ],
  chennai: [
    { name: 'Madhavi Jain', phone: '+91 99119 36066', email: 'madhvi.jain@worksquare.in' },
    { name: 'Saniel Golechha', phone: '+91 98206 45092', email: 'Saniel@worksquare.in' },
  ],
  pune: [
    { name: 'Shubham Gavali', phone: '+91 9619427089', email: 'shubham.gavali@worksquare.in' },
    { name: 'Mehul Kapadia', phone: '+91 9833237615', email: 'mehul.kapadia@worksquare.in' },
  ],
};

// Default contacts for custom cities
const DEFAULT_CONTACTS: ContactInfo[] = [
  { name: 'Madhavi Jain', phone: '+91 99119 36066', email: 'madhvi.jain@worksquare.in' },
  { name: 'Saniel Golechha', phone: '+91 98206 45092', email: 'Saniel@worksquare.in' },
];

function ContactCard({ name, phone, email, accentColor }: ContactCardProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 flex flex-col items-center text-center min-w-[400px] border border-slate-100">
      {/* Avatar */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg"
        style={{ background: accentColor }}
      >
        <User className="text-white" size={44} />
      </div>

      {/* Name */}
      <h3 className="font-bold text-slate-800 mb-6" style={{ fontSize: '25px' }}>{name}</h3>

      {/* Contact Details */}
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-center gap-3 text-slate-600">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: `${accentColor}20` }}
          >
            <Phone size={18} style={{ color: accentColor }} />
          </div>
          <span className="font-medium" style={{ fontSize: '25px' }}>{phone}</span>
        </div>

        <div className="flex items-center justify-center gap-3 text-slate-600">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: `${accentColor}20` }}
          >
            <Mail size={18} style={{ color: accentColor }} />
          </div>
          <span className="font-medium" style={{ fontSize: '25px' }}>{email}</span>
        </div>
      </div>
    </div>
  );
}

export function ThankYouSlide({ id, state }: ThankYouSlideProps) {
  // Get contacts based on selected city, fallback to default for custom cities
  const contactsData = CITY_CONTACTS[state.selectedCity] || DEFAULT_CONTACTS;
  
  const contacts = contactsData.map((contact, index) => ({
    ...contact,
    accentColor: index === 0 ? '#CF8D78' : '#B5533F',
  }));

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
      {/* Decorative elements - coral/peach palette */}
      <div 
        className="absolute rounded-[4rem]"
        style={{
          width: '500px',
          height: '500px',
          top: '-100px',
          right: '-100px',
          background: '#CF8D78',
          opacity: 0.06,
          transform: 'rotate(45deg)',
        }}
      />
      <div 
        className="absolute rounded-[4rem]"
        style={{
          width: '400px',
          height: '400px',
          bottom: '-80px',
          left: '-80px',
          background: '#CF8D78',
          opacity: 0.06,
          transform: 'rotate(45deg)',
        }}
      />
      <div 
        className="absolute rounded-[4rem]"
        style={{
          width: '300px',
          height: '300px',
          top: '40%',
          left: '20%',
          background: '#CF8D78',
          opacity: 0.04,
          transform: 'rotate(45deg)',
        }}
      />

      {/* Logo - Top Right */}
      <img 
        src={autopilotLogo} 
        alt="Autopilot" 
        className="absolute object-contain z-20"
        style={{
          top: '48px',
          right: '64px',
          height: '80px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 
            className="text-7xl font-bold mb-4"
            style={{ color: '#CF8D78' }}
          >
            Thank You!
          </h1>
          <p className="text-2xl max-w-2xl" style={{ color: '#6B7280' }}>
            We appreciate your interest. Let's build your perfect workspace together.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="flex items-center gap-12">
          {contacts.map((contact, index) => (
            <ContactCard
              key={index}
              name={contact.name}
              phone={contact.phone}
              email={contact.email}
              accentColor={contact.accentColor}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div 
        className="absolute bottom-0 left-0 right-0 flex items-center justify-end px-16 py-8"
        style={{ borderTop: '1px solid #F3F4F6' }}
      >
        <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
          © {new Date().getFullYear()} Autopilot Offices. All rights reserved.
        </p>
      </div>
    </div>
  );
}
