export interface BrochureImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface KeyDistance {
  id: string;
  place: string;
  distance: string;
}

export interface ComparisonProperty {
  id: string;
  // Project Details
  name: string;
  location: string;
  googleLocationUrl: string;
  superBuiltUpArea: number | null;
  floorNumbers: string;
  contiguous: 'yes' | 'no' | '';
  possessionToday: string;
  
  // Commercial Details
  carpetArea: number | null;
  builtUpArea: number | null;
  totalSeats: number | null;
  noOfFloors: string;
  floorOffered: string;
  interiorDetails: InteriorDetails;
  possessionDate: string;
  rentPerSqft: number | null;
  camCharges: number | null;
  leaseTerm: string;
  escalation: number | null;
  securityDeposit: string;
  
  // MEP Section
  mepSanctionedLoad: string;
  mepDgBackup: string;
  mepHvacType: string;
  mepHvacOperatingHours: string;
  mepNightRestrictions: string;
  
  // Compliance Section
  complianceOcStatus: string;
  complianceFireNocStatus: string;
  complianceLiftLicenseStatus: string;
  complianceProofNotes: string;
  complianceProof: BrochureImage | null;
  
  // Night Shift Section
  nightShiftApproachRoadLighting: 'good' | 'avg' | 'poor' | '';
  nightShiftSecurityPosture: 'adequate' | 'not-adequate' | '';
  nightShiftSeparateEntry: 'yes' | 'no' | '';
  nightShiftCabPickupSpace: 'yes' | 'no' | '';
  
  // Amenities
  amenities: string[];
  
  // Custom Fields
  customFields: CustomField[];
  
  // Images
  images: BrochureImage[];
}

export type SlideType =
  | 'intro'
  | 'about-company'
  | 'how-autopilot'
  | 'project-details'
  | 'project-showcase'
  | 'project-showcase-property'
  | 'multi-property-comparison'
  | 'inclusions-vision'
  | 'inclusions-exclusions'
  | 'thank-you';

export interface SlideConfig {
  id: string;
  type: SlideType;
  enabled: boolean;
  order: number;
  propertyIndex?: number;
}

export type InteriorDetails = 'bare-shell' | 'warm-shell' | 'fully-furnished' | '';

export const INTERIOR_DETAILS_OPTIONS = [
  { value: 'bare-shell', label: 'Bare Shell' },
  { value: 'warm-shell', label: 'Warm Shell' },
  { value: 'fully-furnished', label: 'Fully Furnished' },
] as const;

export interface BrochureData {
  // Project Details
  propertyName: string;
  location: string;
  googleLocationUrl: string;
  superBuiltUpArea: number | null;
  floorNumbers: string;
  contiguous: 'yes' | 'no' | '';
  possessionToday: string;

  // Commercial Details
  carpetArea: number | null;
  builtUpArea: number | null;
  totalSeats: number | null;
  noOfFloors: string;
  floorOffered: string;
  interiorDetails: InteriorDetails;
  possessionDate: string;
  rentPerSqft: number | null;
  camCharges: number | null;
  leaseTerm: string;
  escalation: number | null;
  securityDeposit: string;

  // MEP Section
  mepSanctionedLoad: string;
  mepDgBackup: string;
  mepHvacType: string;
  mepHvacOperatingHours: string;
  mepNightRestrictions: string;

  // Compliance Section
  complianceOcStatus: string;
  complianceFireNocStatus: string;
  complianceLiftLicenseStatus: string;
  complianceProofNotes: string;
  complianceProof: BrochureImage | null;

  // Night Shift Section
  nightShiftApproachRoadLighting: 'good' | 'avg' | 'poor' | '';
  nightShiftSecurityPosture: 'adequate' | 'not-adequate' | '';
  nightShiftSeparateEntry: 'yes' | 'no' | '';
  nightShiftCabPickupSpace: 'yes' | 'no' | '';

  // Amenities
  amenities: string[];

  // Custom Fields
  customFields: CustomField[];

  // Images
  images: BrochureImage[];

  // Company Info (for About slide)
  companyName: string;
  companyTagline: string;
  companyDescription: string;
  companyLogo: BrochureImage | null;
  teamImage: BrochureImage | null;

  // Contact Info
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;

  // Key Distances (for Location slide)
  keyDistances: KeyDistance[];

  // Comparison Properties (for Multi-Property Comparison slide)
  comparisonProperties: ComparisonProperty[];

  // Slide Configuration
  slides: SlideConfig[];
}

export type BrochureTemplate = 'autopilot' | 'modern' | 'classic';

export type BrochureCity = 'bangalore' | 'mumbai' | 'delhi-ncr' | 'hyderabad' | 'chennai' | 'pune' | string;

export interface CustomCity {
  id: string;
  name: string;
  description: string;
  image: BrochureImage | null;
}

export const CITY_OPTIONS: Array<{
  id: BrochureCity;
  name: string;
  description: string;
}> = [
  { id: 'bangalore', name: 'Bangalore', description: 'Silicon Valley of India' },
  { id: 'mumbai', name: 'Mumbai', description: 'Financial Capital of India' },
  { id: 'delhi-ncr', name: 'Delhi-NCR', description: 'National Capital Region' },
  { id: 'hyderabad', name: 'Hyderabad', description: 'City of Pearls' },
  { id: 'chennai', name: 'Chennai', description: 'Gateway to South India' },
  { id: 'pune', name: 'Pune', description: 'Oxford of the East' },
  { id: 'indore', name: 'Indore', description: 'Commercial Capital of Madhya Pradesh' },
];

export type WizardStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface BrochureState extends BrochureData {
  currentStep: WizardStep;
  selectedTemplate: BrochureTemplate;
  selectedCity: BrochureCity;
  thumbnail: BrochureImage | null;
  customCities: CustomCity[];
}

export const AMENITIES_OPTIONS = [
  'Parking',
  'Cafeteria',
  'Power Backup',
  'Gym',
  'Conference Rooms',
  'High-Speed Lifts',
  'CCTV Security',
  '24/7 Access',
  'Fire Safety',
  'Reception',
  'Pantry',
  'Server Room',
] as const;

export const LEASE_TERM_OPTIONS = [
  { value: '3', label: '3 Years' },
  { value: '5', label: '5 Years' },
  { value: '9', label: '9 Years' },
  { value: '11', label: '11 Years' },
] as const;

export const YES_NO_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

export const LIGHTING_OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'avg', label: 'Average' },
  { value: 'poor', label: 'Poor' },
] as const;

export const SECURITY_POSTURE_OPTIONS = [
  { value: 'adequate', label: 'Adequate' },
  { value: 'not-adequate', label: 'Not Adequate' },
] as const;

export const DEFAULT_SLIDES: SlideConfig[] = [
  { id: 'intro', type: 'intro', enabled: true, order: 0 },
  { id: 'about-company', type: 'about-company', enabled: true, order: 1 },
  { id: 'how-autopilot', type: 'how-autopilot', enabled: true, order: 2 },
  { id: 'project-details', type: 'project-details', enabled: true, order: 3 },
  { id: 'project-showcase', type: 'project-showcase', enabled: true, order: 4 },
  { id: 'multi-property-comparison', type: 'multi-property-comparison', enabled: true, order: 5 },
  { id: 'inclusions-vision', type: 'inclusions-vision', enabled: true, order: 6 },
  { id: 'inclusions-exclusions', type: 'inclusions-exclusions', enabled: true, order: 7 },
  { id: 'thank-you', type: 'thank-you', enabled: true, order: 8 },
];

export const SLIDE_LABELS: Record<SlideType, string> = {
  'intro': 'Intro Slide',
  'about-company': 'About Company',
  'how-autopilot': 'How Autopilot Comes Together',
  'project-details': 'Project Details',
  'project-showcase': 'Project Showcase',
  'project-showcase-property': 'Project Showcase',
  'multi-property-comparison': 'Multi Property Comparison',
  'inclusions-vision': 'Vision to Operation',
  'inclusions-exclusions': 'Inclusions & Exclusions',
  'thank-you': 'Thank You',
};

export const initialBrochureState: BrochureState = {
  propertyName: '',
  location: '',
  googleLocationUrl: '',
  superBuiltUpArea: null,
  floorNumbers: '',
  contiguous: '',
  possessionToday: '',
  carpetArea: null,
  builtUpArea: null,
  totalSeats: null,
  noOfFloors: '',
  floorOffered: '',
  interiorDetails: '',
  possessionDate: '',
  rentPerSqft: null,
  camCharges: null,
  leaseTerm: '',
  escalation: null,
  securityDeposit: '',
  mepSanctionedLoad: '',
  mepDgBackup: '',
  mepHvacType: '',
  mepHvacOperatingHours: '',
  mepNightRestrictions: '',
  complianceOcStatus: '',
  complianceFireNocStatus: '',
  complianceLiftLicenseStatus: '',
  complianceProofNotes: '',
  complianceProof: null,
  nightShiftApproachRoadLighting: '',
  nightShiftSecurityPosture: '',
  nightShiftSeparateEntry: '',
  nightShiftCabPickupSpace: '',
  amenities: [],
  customFields: [],
  images: [],
  companyName: '',
  companyTagline: '',
  companyDescription: '',
  companyLogo: null,
  teamImage: null,
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  contactAddress: '',
  keyDistances: [],
  comparisonProperties: [],
  slides: [...DEFAULT_SLIDES],
  currentStep: 0,
  selectedTemplate: 'autopilot',
  selectedCity: 'bangalore',
  thumbnail: null,
  customCities: [],
};
