import { useEffect, useRef } from 'react';
import { BrochureState, INTERIOR_DETAILS_OPTIONS, LIGHTING_OPTIONS, SECURITY_POSTURE_OPTIONS, YES_NO_OPTIONS } from '@/types/brochure';
import {
  MapPin,
  Layers,
  Armchair,
  IndianRupee,
  Lock,
  Calendar,
  Shield,
  TrendingUp,
  ImageIcon,
  Building2,
  Sparkles,
  Square,
  ExternalLink,
  LayoutGrid,
  Zap,
  Battery,
  Wind,
  Clock,
  Moon,
  FileCheck,
  Flame,
  Lightbulb,
  ShieldCheck,
  DoorOpen,
  Car,
  Hash,
  Combine,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '@/utils/pdfExport';
import { pdfLinkRegistry } from '@/utils/pdfLinkRegistry';
import autopilotLogo from '@/assets/autopilot-logo.png';

interface ProjectShowcaseSlideProps {
  id?: string;
  state: BrochureState;
  propertyIndex?: number;
}

interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  bgColor: string;
  iconColor: string;
  linkUrl?: string;
}

interface CardStyles {
  padding: string;
  iconSize: number;
  iconContainerSize: string;
  labelSize: string;
  valueSize: string;
}

interface CardSection {
  title: string;
  cards: InfoCardProps[];
}

function getRightSideCardStyles(): CardStyles {
  return {
    padding: 'py-2 px-3',
    iconSize: 18,
    iconContainerSize: 'w-9 h-9',
    labelSize: '10px',
    valueSize: '13px',
  };
}

function getOverflowCardStyles(): CardStyles {
  return {
    padding: 'py-2 px-3',
    iconSize: 18,
    iconContainerSize: 'w-9 h-9',
    labelSize: '10px',
    valueSize: '13px',
  };
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-2 flex items-center gap-2 mt-1 first:mt-0">
      <div className="w-1 h-3 rounded-full" style={{ backgroundColor: '#B5533F' }} />
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{title}</p>
    </div>
  );
}

interface InfoCardWithRefProps extends InfoCardProps {
  styles: CardStyles;
  onLinkRef?: (element: HTMLAnchorElement | null) => void;
}

function InfoCard({ icon: Icon, label, value, bgColor, iconColor, linkUrl, styles, onLinkRef }: InfoCardWithRefProps) {
  return (
    <div className={`ps-info-card bg-white border border-slate-200 rounded-2xl ${styles.padding} flex items-center gap-3 shadow-md`}>
      <div className={`${styles.iconContainerSize} rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
        <Icon className={iconColor} size={styles.iconSize} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-500 uppercase tracking-wider" style={{ fontSize: styles.labelSize }}>{label}</p>
        <p 
          className="ps-info-value font-bold text-slate-800 break-words" 
          style={{ 
            fontSize: styles.valueSize,
            lineHeight: '1.3',
            maxHeight: '2.6em',
            overflow: 'hidden',
          }}
        >
          {value}
        </p>
      </div>
      {linkUrl && (
        <a 
          ref={onLinkRef}
          href={linkUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
        >
          <ExternalLink className="text-blue-600" size={14} />
        </a>
      )}
    </div>
  );
}

export function ProjectShowcaseSlide({ id, state, propertyIndex }: ProjectShowcaseSlideProps) {
  const slideRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  
  // Determine which property data to display
  const isComparisonProperty = propertyIndex !== undefined;
  const propertyData = isComparisonProperty 
    ? state.comparisonProperties[propertyIndex]
    : null;

  // Use main property or comparison property data
  const heroImage = isComparisonProperty
    ? propertyData?.images[0]?.previewUrl
    : state.images[0]?.previewUrl;
  const propertyName = isComparisonProperty 
    ? propertyData?.name || 'Property Name'
    : state.propertyName || 'Property Name';
  const location = isComparisonProperty ? propertyData?.location : state.location;
  const googleLocationUrl = isComparisonProperty ? propertyData?.googleLocationUrl : state.googleLocationUrl;
  const carpetArea = isComparisonProperty ? propertyData?.carpetArea : state.carpetArea;
  const superBuiltUpArea = isComparisonProperty ? propertyData?.superBuiltUpArea : state.superBuiltUpArea;
  const builtUpArea = isComparisonProperty ? propertyData?.builtUpArea : state.builtUpArea;
  const totalSeats = isComparisonProperty ? propertyData?.totalSeats : state.totalSeats;
  const noOfFloors = isComparisonProperty ? propertyData?.noOfFloors : state.noOfFloors;
  const floorOffered = isComparisonProperty ? propertyData?.floorOffered : state.floorOffered;
  const floorNumbers = isComparisonProperty ? propertyData?.floorNumbers : state.floorNumbers;
  const contiguous = isComparisonProperty ? propertyData?.contiguous : state.contiguous;
  const possessionToday = isComparisonProperty ? propertyData?.possessionToday : state.possessionToday;
  const interiorDetails = isComparisonProperty ? propertyData?.interiorDetails : state.interiorDetails;
  const possessionDate = isComparisonProperty ? propertyData?.possessionDate : state.possessionDate;
  const rentPerSqft = isComparisonProperty ? propertyData?.rentPerSqft : state.rentPerSqft;
  const leaseTerm = isComparisonProperty ? propertyData?.leaseTerm : state.leaseTerm;
  const securityDeposit = isComparisonProperty ? propertyData?.securityDeposit : state.securityDeposit;
  const escalation = isComparisonProperty ? propertyData?.escalation : state.escalation;
  
  // MEP fields
  const mepSanctionedLoad = isComparisonProperty ? propertyData?.mepSanctionedLoad : state.mepSanctionedLoad;
  const mepDgBackup = isComparisonProperty ? propertyData?.mepDgBackup : state.mepDgBackup;
  const mepHvacType = isComparisonProperty ? propertyData?.mepHvacType : state.mepHvacType;
  const mepHvacOperatingHours = isComparisonProperty ? propertyData?.mepHvacOperatingHours : state.mepHvacOperatingHours;
  const mepNightRestrictions = isComparisonProperty ? propertyData?.mepNightRestrictions : state.mepNightRestrictions;
  
  // Compliance fields
  const complianceOcStatus = isComparisonProperty ? propertyData?.complianceOcStatus : state.complianceOcStatus;
  const complianceFireNocStatus = isComparisonProperty ? propertyData?.complianceFireNocStatus : state.complianceFireNocStatus;
  const complianceLiftLicenseStatus = isComparisonProperty ? propertyData?.complianceLiftLicenseStatus : state.complianceLiftLicenseStatus;
  
  // Night Shift fields
  const nightShiftApproachRoadLighting = isComparisonProperty ? propertyData?.nightShiftApproachRoadLighting : state.nightShiftApproachRoadLighting;
  const nightShiftSecurityPosture = isComparisonProperty ? propertyData?.nightShiftSecurityPosture : state.nightShiftSecurityPosture;
  const nightShiftSeparateEntry = isComparisonProperty ? propertyData?.nightShiftSeparateEntry : state.nightShiftSeparateEntry;
  const nightShiftCabPickupSpace = isComparisonProperty ? propertyData?.nightShiftCabPickupSpace : state.nightShiftCabPickupSpace;

  // Amenities
  const amenities = isComparisonProperty ? propertyData?.amenities : state.amenities;

  // Register link position for PDF export
  useEffect(() => {
    if (id && linkRef.current && slideRef.current && googleLocationUrl) {
      const slideRect = slideRef.current.getBoundingClientRect();
      const linkRect = linkRef.current.getBoundingClientRect();
      
      // Calculate position relative to slide
      const x = linkRect.left - slideRect.left;
      const y = linkRect.top - slideRect.top;
      
      pdfLinkRegistry.register({
        slideId: id,
        url: googleLocationUrl,
        x,
        y,
        width: linkRect.width,
        height: linkRect.height,
      });
    }
    
    return () => {
      if (id) {
        pdfLinkRegistry.clearSlide(id);
      }
    };
  }, [id, googleLocationUrl]);

  // Calculate per seat charges
  const perSeatCharges =
    rentPerSqft && builtUpArea && totalSeats
      ? Math.round((rentPerSqft * builtUpArea) / totalSeats)
      : null;

  // Get labels for select fields
  const interiorDetailsLabel = interiorDetails
    ? INTERIOR_DETAILS_OPTIONS.find(opt => opt.value === interiorDetails)?.label || interiorDetails
    : null;
  const contiguousLabel = contiguous
    ? YES_NO_OPTIONS.find(opt => opt.value === contiguous)?.label || contiguous
    : null;
  const approachRoadLightingLabel = nightShiftApproachRoadLighting
    ? LIGHTING_OPTIONS.find(opt => opt.value === nightShiftApproachRoadLighting)?.label || nightShiftApproachRoadLighting
    : null;
  const securityPostureLabel = nightShiftSecurityPosture
    ? SECURITY_POSTURE_OPTIONS.find(opt => opt.value === nightShiftSecurityPosture)?.label || nightShiftSecurityPosture
    : null;
  const separateEntryLabel = nightShiftSeparateEntry
    ? YES_NO_OPTIONS.find(opt => opt.value === nightShiftSeparateEntry)?.label || nightShiftSeparateEntry
    : null;
  const cabPickupSpaceLabel = nightShiftCabPickupSpace
    ? YES_NO_OPTIONS.find(opt => opt.value === nightShiftCabPickupSpace)?.label || nightShiftCabPickupSpace
    : null;

  // Build sections with categorized cards
  const sections: CardSection[] = [
    {
      title: 'Project Details',
      cards: [
        location && {
          icon: MapPin,
          label: 'Location',
          value: location,
          bgColor: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          linkUrl: googleLocationUrl || undefined,
        },
        superBuiltUpArea && {
          icon: Layers,
          label: 'Super Built-up Area',
          value: `${superBuiltUpArea.toLocaleString()} sqft`,
          bgColor: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
        },
        noOfFloors && {
          icon: Building2,
          label: 'No. of Floors',
          value: noOfFloors,
          bgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
        },
        floorOffered && {
          icon: LayoutGrid,
          label: 'Floor Offered',
          value: floorOffered,
          bgColor: 'bg-violet-100',
          iconColor: 'text-violet-600',
        },
        floorNumbers && {
          icon: Hash,
          label: 'Floor No(s)',
          value: floorNumbers,
          bgColor: 'bg-fuchsia-100',
          iconColor: 'text-fuchsia-600',
        },
        contiguousLabel && {
          icon: Combine,
          label: 'Contiguous',
          value: contiguousLabel,
          bgColor: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
        },
        possessionToday && {
          icon: CalendarCheck,
          label: 'Possession Today',
          value: possessionToday,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        interiorDetailsLabel && {
          icon: Sparkles,
          label: 'Interior Details',
          value: interiorDetailsLabel,
          bgColor: 'bg-pink-100',
          iconColor: 'text-pink-600',
        },
        possessionDate && {
          icon: Calendar,
          label: 'Possession of Building',
          value: possessionDate,
          bgColor: 'bg-rose-100',
          iconColor: 'text-rose-600',
        },
      ].filter(Boolean) as InfoCardProps[],
    },
    {
      title: 'Commercial Details',
      cards: [
        carpetArea && {
          icon: Square,
          label: 'Carpet Area',
          value: `${carpetArea.toLocaleString()} sqft`,
          bgColor: 'bg-teal-100',
          iconColor: 'text-teal-600',
        },
        builtUpArea && {
          icon: Layers,
          label: 'Built-up Area',
          value: `${builtUpArea.toLocaleString()} sqft`,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
        totalSeats && {
          icon: Armchair,
          label: 'Total Seats',
          value: `${totalSeats} Seats`,
          bgColor: 'bg-purple-100',
          iconColor: 'text-purple-600',
        },
        rentPerSqft && {
          icon: IndianRupee,
          label: 'Rent per sqft',
          value: `INR ${rentPerSqft.toLocaleString()}`,
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600',
        },
        leaseTerm && {
          icon: Lock,
          label: 'Lease Term',
          value: `${leaseTerm} Months`,
          bgColor: 'bg-sky-100',
          iconColor: 'text-sky-600',
        },
        securityDeposit && {
          icon: Shield,
          label: 'Security Deposit',
          value: securityDeposit,
          bgColor: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
        },
        escalation && {
          icon: TrendingUp,
          label: 'Escalation',
          value: `${escalation}% Per Annum`,
          bgColor: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
        },
        perSeatCharges && {
          icon: IndianRupee,
          label: 'Per Seat Charges',
          value: `INR ${perSeatCharges.toLocaleString()}`,
          bgColor: 'bg-lime-100',
          iconColor: 'text-lime-600',
        },
      ].filter(Boolean) as InfoCardProps[],
    },
    {
      title: 'MEP',
      cards: [
        mepSanctionedLoad && {
          icon: Zap,
          label: 'Sanctioned Load',
          value: mepSanctionedLoad,
          bgColor: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
        },
        mepDgBackup && {
          icon: Battery,
          label: 'DG Backup',
          value: mepDgBackup,
          bgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
        },
        mepHvacType && {
          icon: Wind,
          label: 'HVAC Type',
          value: mepHvacType,
          bgColor: 'bg-sky-100',
          iconColor: 'text-sky-600',
        },
        mepHvacOperatingHours && {
          icon: Clock,
          label: 'HVAC Operating Hours',
          value: mepHvacOperatingHours,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
        mepNightRestrictions && {
          icon: Moon,
          label: 'Night Restrictions',
          value: mepNightRestrictions,
          bgColor: 'bg-indigo-100',
          iconColor: 'text-indigo-600',
        },
      ].filter(Boolean) as InfoCardProps[],
    },
    {
      title: 'Compliance',
      cards: [
        complianceOcStatus && {
          icon: FileCheck,
          label: 'OC Status',
          value: complianceOcStatus,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
        },
        complianceFireNocStatus && {
          icon: Flame,
          label: 'Fire NOC Status',
          value: complianceFireNocStatus,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
        },
        complianceLiftLicenseStatus && {
          icon: Building2,
          label: 'Lift License Status',
          value: complianceLiftLicenseStatus,
          bgColor: 'bg-slate-100',
          iconColor: 'text-slate-600',
        },
      ].filter(Boolean) as InfoCardProps[],
    },
    {
      title: 'Night Shift',
      cards: [
        approachRoadLightingLabel && {
          icon: Lightbulb,
          label: 'Approach Road Lighting',
          value: approachRoadLightingLabel,
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600',
        },
        securityPostureLabel && {
          icon: ShieldCheck,
          label: 'Security Posture',
          value: securityPostureLabel,
          bgColor: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
        },
        separateEntryLabel && {
          icon: DoorOpen,
          label: 'Separate Entry',
          value: separateEntryLabel,
          bgColor: 'bg-violet-100',
          iconColor: 'text-violet-600',
        },
        cabPickupSpaceLabel && {
          icon: Car,
          label: 'Cab Pickup Space',
          value: cabPickupSpaceLabel,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
        },
      ].filter(Boolean) as InfoCardProps[],
    },
    {
      title: 'Amenities',
      cards: (amenities || []).slice(0, 4).map((amenityValue, idx) => {
        const colors = [
          { bg: 'bg-teal-100', icon: 'text-teal-600' },
          { bg: 'bg-purple-100', icon: 'text-purple-600' },
          { bg: 'bg-rose-100', icon: 'text-rose-600' },
          { bg: 'bg-amber-100', icon: 'text-amber-600' },
        ];
        const color = colors[idx % colors.length];
        return {
          icon: CheckCircle,
          label: 'Amenity',
          value: amenityValue,
          bgColor: color.bg,
          iconColor: color.icon,
        };
      }),
    },
  ];

  // Filter out empty sections
  const nonEmptySections = sections.filter(s => s.cards.length > 0);
  
  // Flatten all cards for overflow calculation
  const allCards = nonEmptySections.flatMap(s => s.cards);
  const totalCardCount = allCards.length + nonEmptySections.length; // cards + headers
  
  // Calculate how many sections fit on right side (approx 10 items max to ensure overflow fits)
  const rightSideMaxItems = 10;
  let rightSideItemCount = 0;
  let rightSideSections: CardSection[] = [];
  let overflowSections: CardSection[] = [];
  
  for (const section of nonEmptySections) {
    const sectionItemCount = section.cards.length + 1; // cards + header
    if (rightSideItemCount + sectionItemCount <= rightSideMaxItems) {
      rightSideSections.push(section);
      rightSideItemCount += sectionItemCount;
    } else {
      overflowSections.push(section);
    }
  }
  
  // Calculate overflow height needed - tighter layout with smaller row height
  const overflowCardCount = overflowSections.reduce((acc, s) => acc + s.cards.length + 1, 0);
  const overflowRowsNeeded = Math.ceil(overflowCardCount / 4);
  const overflowHeight = overflowRowsNeeded * 52 + 16; // 52px per row + minimal padding
  
  const rightSideStyles = getRightSideCardStyles();
  const overflowStyles = getOverflowCardStyles();

  return (
    <div
      ref={slideRef}
      id={id}
      className="relative overflow-hidden"
      style={{
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        background: 'linear-gradient(135deg, #FDF8F5 0%, #F5E6DC 100%)',
        fontFamily: "'Urbanist', sans-serif",
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-16 py-6 z-10">
        <h1 className="text-3xl font-bold text-slate-800">
          Project Details -{' '}
          <span style={{ color: '#B5533F' }}>{propertyName}</span>
        </h1>
        <img 
          src={autopilotLogo} 
          alt="Autopilot" 
          style={{ height: '80px' }}
          className="object-contain"
        />
      </div>

      {/* Main Content - Two Column Layout - Tight to overflow */}
      <div className="absolute top-28 left-16 right-16 flex gap-6" style={{ bottom: overflowSections.length > 0 ? `${overflowHeight + 48}px` : '60px' }}>
        {/* Left Column - Hero Image (narrower, with aspect ratio) */}
        <div className="w-[620px] flex-shrink-0">
          <div
            className="w-full rounded-3xl overflow-hidden shadow-2xl"
            style={{
              border: '8px solid white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              aspectRatio: '4/3',
            }}
          >
            {heroImage ? (
              <img
                src={heroImage}
                alt={propertyName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center">
                  <ImageIcon className="text-slate-400" size={40} />
                </div>
                <p className="text-slate-500 text-lg font-medium">Upload an image to display here</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Info Cards with Section Headers */}
        {rightSideSections.length > 0 && (
          <div className="flex-1 grid grid-cols-2 gap-2 content-start">
            {rightSideSections.map((section, sectionIdx) => (
              <>
                <SectionHeader key={`header-${sectionIdx}`} title={section.title} />
                {section.cards.map((card, cardIdx) => (
                  <InfoCard 
                    key={`${sectionIdx}-${cardIdx}`} 
                    {...card} 
                    styles={rightSideStyles}
                    onLinkRef={card.linkUrl ? (el) => { linkRef.current = el; } : undefined}
                  />
                ))}
              </>
            ))}
          </div>
        )}
      </div>

      {overflowSections.length > 0 && (
        <div className="absolute left-16 right-16" style={{ top: '620px' }}>
          <div className="grid grid-cols-4 gap-1.5 content-start">
            {overflowSections.map((section, sectionIdx) => (
              <>
                <div key={`overflow-header-${sectionIdx}`} className="col-span-4 flex items-center gap-2 mt-1 first:mt-0">
                  <div className="w-1 h-3 rounded-full" style={{ backgroundColor: '#B5533F' }} />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{section.title}</p>
                </div>
                {section.cards.map((card, cardIdx) => (
                  <InfoCard 
                    key={`overflow-${sectionIdx}-${cardIdx}`} 
                    {...card} 
                    styles={overflowStyles}
                    onLinkRef={card.linkUrl ? (el) => { linkRef.current = el; } : undefined}
                  />
                ))}
              </>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-16 py-4">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Autopilot. All rights reserved.
        </p>
        <p className="text-xs text-slate-400 font-medium">
          Property Variant: Commercial Office Space
        </p>
      </div>
    </div>
  );
}
