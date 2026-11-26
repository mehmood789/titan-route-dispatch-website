export type PageRoute =
  | 'home'
  | 'services'
  | 'pricing'
  | 'testimonials'
  | 'register'
  | 'contact'
  | 'contact-us'
  | 'about-us'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'disclaimer'
  | 'admin';

export type EquipmentType =
  | 'Hotshot'
  | 'Power Only'
  | 'Box Truck'
  | 'Dry Van'
  | 'Reefer'
  | 'Flatbed'
  | 'Step Deck'
  | string;

export type CarrierStatus = 'Pending Review' | 'Onboarding' | 'Approved' | 'Declined';

export type LoadStatus = 'Booked' | 'Dispatched' | 'In Transit' | 'Delivered';

export type InquiryStatus = 'Open' | 'Read' | 'Replied' | 'Resolved';

export interface UploadedDocument {
  id: string;
  docId?: string;
  storagePath?: string;
  storageBucket?: string;
  storageProvider?: 'firebase-storage' | 'private-vault';
  docType:
    | 'MC Authority Letter'
    | 'Certificate of Insurance (COI)'
    | 'W-9 Tax Form'
    | 'Notice of Assignment';
  fileName: string;
  sizeLabel: string;
  uploadedAt: string;
}

export interface CarrierLookupSnapshot {
  performed: boolean;
  lookupStatus: 'verified' | 'manual' | 'not_found' | 'not_run';
  source: string;
  sourceUpdatedAt: string;
  timestamp: string;
  dbaName: string;
  operatingStatus: string;
  authorityInfo: string;
  safetyInfo: string;
  insuranceInfo: string;
  fleetInfo: string;
  usdotNumber: string;
  legalName: string;
  physicalAddress: string;
  mailingAddress: string;
}

export interface CarrierApplication {
  id: string;
  referenceCode: string;
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  mcNumber: string;
  dotNumber: string;
  physicalAddress?: string;
  mailingAddress?: string;
  carrierLookup?: CarrierLookupSnapshot;
  equipmentType: EquipmentType;
  truckCount: number;
  operatingRegions: string[];
  factoringCompany: string;
  insuranceActive: boolean;
  selectedPlan: string;
  notes: string;
  documents: UploadedDocument[];
  status: CarrierStatus;
  submittedAt: any;
}

export interface DispatchLoad {
  id: string;
  loadNumber: string;
  carrierName: string;
  mcNumber: string;
  origin: string;
  destination: string;
  equipmentType: EquipmentType;
  miles: number;
  grossPay: number;
  rpm: number;
  brokerName: string;
  pickupDate: string;
  status: LoadStatus;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  createdAt: any;
}

export interface ServiceOffering {
  id: string;
  number: string;
  slug: string;
  equipment: EquipmentType;
  title: string;
  summary: string;
  targetRpm: string;
  avgWeeklyGross: string;
  deliverables: string[];
  image: string;
  imageAlt: string;
  displayOrder: number;
  enabled: boolean;
  updatedAt?: any;
}

export interface PricingTier {
  id: string;
  name: string;
  audience: string;
  rateLabel: string;
  rateSubtext: string;
  truckRange: string;
  highlighted: boolean;
  description: string;
  ctaLabel: string;
  displayOrder: number;
  limits: {
    label: string;
    value: string;
  }[];
  updatedAt?: any;
}

export interface TestimonialItem {
  id: string;
  driverName: string;
  role: string;
  company: string;
  mcNumber: string;
  equipment: string;
  homeBase: string;
  beforeMetric: string;
  afterMetric: string;
  outcomeSummary: string;
  quote: string;
  photoUrl: string;
  permissionGranted: boolean;
  displayOrder: number;
  updatedAt?: any;
}

export type MediaCategory =
  | 'logo'
  | 'favicon'
  | 'hero'
  | 'service'
  | 'background'
  | 'testimonial'
  | 'seo';

export interface MediaAsset {
  id: string;
  label: string;
  category: MediaCategory;
  fileName: string;
  mimeType: string;
  url: string;
  sizeLabel: string;
  createdAt?: any;
}

export interface NavItemConfig {
  id: string;
  label: string;
  page: PageRoute;
  visible: boolean;
}

export interface SiteContent {
  companyName: string;
  shortName: string;
  domain: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  hours: string;
  slogan: string;
  footerText: string;
  logoUrl: string;
  welcomeLogoUrl: string;
  faviconUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImage: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaPage: PageRoute;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaPage: PageRoute;
  welcomeHeadline: string;
  welcomeSlogan: string;
  operationsTitle: string;
  operationsDescription: string;
  operationsImage: string;
  ctaTitle: string;
  ctaSubtitle: string;
  colors: {
    deepNavy: string;
    professionalRed: string;
    white: string;
    silverGrey: string;
    darkBackground: string;
  };
  typography: {
    displayFont: string;
    bodyFont: string;
  };
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    linkedin: string;
    x: string;
  };
  sections: {
    showMetrics: boolean;
    showServices: boolean;
    showOperations: boolean;
    showTestimonials: boolean;
    showCtaBand: boolean;
  };
  navItems: NavItemConfig[];
  updatedAt?: any;
}
