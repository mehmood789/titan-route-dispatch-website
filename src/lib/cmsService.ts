import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  getBlob,
  ref as storageRef,
  uploadBytesResumable,
} from 'firebase/storage';
import {
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_PRICING_PLANS,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONTENT,
  DEFAULT_TESTIMONIALS,
} from './cmsDefaults.ts';
import {auth, db, handleFirestoreError, OperationType, storage} from './firebase.ts';
import type {
  CarrierApplication,
  CarrierLookupSnapshot,
  CarrierStatus,
  ContactInquiry,
  DispatchLoad,
  InquiryStatus,
  LoadStatus,
  MediaAsset,
  MediaCategory,
  PricingTier,
  ServiceOffering,
  SiteContent,
  TestimonialItem,
  UploadedDocument,
} from '../types.ts';

const FULL_COMPANY_NAME = 'Titan Route Dispatch (TRD) LLC';

function normalizeVisibleBrandText(value?: string | null): string {
  if (!value) return '';
  return value.replace(
    /Titan Route Dispatch\s*\(TRD\)(?:\s*LLC)?|Titan Route Dispatch LLC|Titan Route Dispatch|TR Dispatch|(?<![@.\w-])TRD(?![\w-])|(?<![@./:])\btrdispatch\.us\b/gi,
    FULL_COMPANY_NAME
  );
}

function sanitizeSiteContentForWrite(content: SiteContent): Record<string, unknown> {
  const safeEmail = content.email?.trim() || DEFAULT_SITE_CONTENT.email;
  const safeAddress =
    content.address?.includes('1420 Stemmons') || !content.address?.trim()
      ? DEFAULT_SITE_CONTENT.address
      : content.address.trim();
  return {
    companyName: normalizeVisibleBrandText(content.companyName) || DEFAULT_SITE_CONTENT.companyName,
    shortName: normalizeVisibleBrandText(content.shortName) || DEFAULT_SITE_CONTENT.shortName,
    domain: content.domain || DEFAULT_SITE_CONTENT.domain,
    email:
      safeEmail.toLowerCase() === 'dispatch@trdispatch.us' ? DEFAULT_SITE_CONTENT.email : safeEmail,
    phone: content.phone,
    whatsappNumber: content.whatsappNumber,
    address: safeAddress,
    hours: content.hours,
    slogan: content.slogan,
    footerText: normalizeVisibleBrandText(content.footerText),
    logoUrl: content.logoUrl,
    welcomeLogoUrl: content.welcomeLogoUrl,
    faviconUrl: content.faviconUrl,
    heroHeadline: normalizeVisibleBrandText(content.heroHeadline),
    heroSubheadline: normalizeVisibleBrandText(content.heroSubheadline),
    heroImage: content.heroImage,
    heroPrimaryCtaLabel: content.heroPrimaryCtaLabel,
    heroPrimaryCtaPage: content.heroPrimaryCtaPage,
    heroSecondaryCtaLabel: content.heroSecondaryCtaLabel,
    heroSecondaryCtaPage: content.heroSecondaryCtaPage,
    welcomeHeadline: normalizeVisibleBrandText(content.welcomeHeadline) || DEFAULT_SITE_CONTENT.welcomeHeadline,
    welcomeSlogan: content.welcomeSlogan,
    operationsTitle: normalizeVisibleBrandText(content.operationsTitle),
    operationsDescription: normalizeVisibleBrandText(content.operationsDescription),
    operationsImage: content.operationsImage,
    ctaTitle: normalizeVisibleBrandText(content.ctaTitle),
    ctaSubtitle: normalizeVisibleBrandText(content.ctaSubtitle),
    colors: {
      deepNavy: content.colors.deepNavy,
      professionalRed: content.colors.professionalRed,
      white: content.colors.white,
      silverGrey: content.colors.silverGrey,
      darkBackground: content.colors.darkBackground,
    },
    typography: {
      displayFont: content.typography.displayFont,
      bodyFont: content.typography.bodyFont,
    },
    seo: {
      title: normalizeVisibleBrandText(content.seo.title) || DEFAULT_SITE_CONTENT.seo.title,
      description:
        normalizeVisibleBrandText(content.seo.description) || DEFAULT_SITE_CONTENT.seo.description,
      ogImage: content.seo.ogImage,
    },
    socialLinks: {
      facebook: content.socialLinks.facebook,
      instagram: content.socialLinks.instagram,
      linkedin: content.socialLinks.linkedin,
      x: content.socialLinks.x,
    },
    sections: {
      showMetrics: Boolean(content.sections.showMetrics),
      showServices: Boolean(content.sections.showServices),
      showOperations: Boolean(content.sections.showOperations),
      showTestimonials: Boolean(content.sections.showTestimonials),
      showCtaBand: Boolean(content.sections.showCtaBand),
    },
    navItems: content.navItems
      .filter((n) => n.page !== 'admin')
      .map((n) => ({
        id: n.id,
        label: n.label,
        page: n.page,
        visible: Boolean(n.visible),
      })),
    updatedAt: serverTimestamp(),
  };
}

function sanitizeServiceForWrite(service: ServiceOffering): Record<string, unknown> {
  return {
    id: service.id,
    number: service.number,
    slug: service.slug,
    equipment: service.equipment,
    title: service.title,
    summary: service.summary,
    targetRpm: service.targetRpm,
    avgWeeklyGross: service.avgWeeklyGross,
    deliverables: service.deliverables,
    image: service.image,
    imageAlt: service.imageAlt,
    displayOrder: Number(service.displayOrder),
    enabled: Boolean(service.enabled),
    updatedAt: serverTimestamp(),
  };
}

function sanitizePricingForWrite(plan: PricingTier): Record<string, unknown> {
  return {
    id: plan.id,
    name: plan.name,
    audience: plan.audience,
    rateLabel: plan.rateLabel,
    rateSubtext: plan.rateSubtext,
    truckRange: plan.truckRange,
    highlighted: Boolean(plan.highlighted),
    description: plan.description,
    ctaLabel: plan.ctaLabel,
    displayOrder: Number(plan.displayOrder),
    limits: plan.limits.map((l) => ({label: l.label, value: l.value})),
    updatedAt: serverTimestamp(),
  };
}

function sanitizeTestimonialForWrite(item: TestimonialItem): Record<string, unknown> {
  return {
    id: item.id,
    driverName: item.driverName,
    role: item.role,
    company: item.company,
    mcNumber: item.mcNumber,
    equipment: item.equipment,
    homeBase: item.homeBase,
    beforeMetric: item.beforeMetric,
    afterMetric: item.afterMetric,
    outcomeSummary: item.outcomeSummary,
    quote: item.quote,
    photoUrl: item.photoUrl || '',
    permissionGranted: Boolean(item.permissionGranted),
    displayOrder: Number(item.displayOrder),
    updatedAt: serverTimestamp(),
  };
}

function sanitizeLoadForWrite(load: DispatchLoad): Record<string, unknown> {
  return {
    id: load.id,
    loadNumber: load.loadNumber,
    carrierName: load.carrierName,
    mcNumber: load.mcNumber,
    origin: load.origin,
    destination: load.destination,
    equipmentType: load.equipmentType,
    miles: Number(load.miles),
    grossPay: Number(load.grossPay),
    rpm: Number(load.rpm),
    brokerName: load.brokerName,
    pickupDate: load.pickupDate,
    status: load.status,
  };
}

function mergeSiteContent(raw?: Partial<SiteContent> | null): SiteContent {
  if (!raw) return DEFAULT_SITE_CONTENT;
  const rawEmail = typeof raw.email === 'string' ? raw.email.trim() : '';
  const safeEmail =
    !rawEmail || rawEmail.toLowerCase() === 'dispatch@trdispatch.us'
      ? DEFAULT_SITE_CONTENT.email
      : rawEmail;
  const rawAddress = typeof raw.address === 'string' ? raw.address.trim() : '';
  const safeAddress =
    !rawAddress || rawAddress.includes('1420 Stemmons')
      ? DEFAULT_SITE_CONTENT.address
      : rawAddress;
  const filteredNav = Array.isArray(raw.navItems)
    ? raw.navItems.filter((n) => n.page !== 'admin')
    : [];
  const mergedSeo = {...DEFAULT_SITE_CONTENT.seo, ...(raw.seo || {})};
  return {
    ...DEFAULT_SITE_CONTENT,
    ...raw,
    companyName:
      normalizeVisibleBrandText(raw.companyName) || DEFAULT_SITE_CONTENT.companyName,
    shortName: normalizeVisibleBrandText(raw.shortName) || DEFAULT_SITE_CONTENT.shortName,
    welcomeHeadline:
      normalizeVisibleBrandText(raw.welcomeHeadline) || DEFAULT_SITE_CONTENT.welcomeHeadline,
    heroHeadline: normalizeVisibleBrandText(raw.heroHeadline) || DEFAULT_SITE_CONTENT.heroHeadline,
    heroSubheadline:
      normalizeVisibleBrandText(raw.heroSubheadline) || DEFAULT_SITE_CONTENT.heroSubheadline,
    footerText: normalizeVisibleBrandText(raw.footerText) || DEFAULT_SITE_CONTENT.footerText,
    operationsTitle:
      normalizeVisibleBrandText(raw.operationsTitle) || DEFAULT_SITE_CONTENT.operationsTitle,
    operationsDescription:
      normalizeVisibleBrandText(raw.operationsDescription) ||
      DEFAULT_SITE_CONTENT.operationsDescription,
    ctaTitle: normalizeVisibleBrandText(raw.ctaTitle) || DEFAULT_SITE_CONTENT.ctaTitle,
    ctaSubtitle: normalizeVisibleBrandText(raw.ctaSubtitle) || DEFAULT_SITE_CONTENT.ctaSubtitle,
    email: safeEmail,
    address: safeAddress,
    colors: {...DEFAULT_SITE_CONTENT.colors, ...(raw.colors || {})},
    typography: {...DEFAULT_SITE_CONTENT.typography, ...(raw.typography || {})},
    seo: {
      ...mergedSeo,
      title: normalizeVisibleBrandText(mergedSeo.title) || DEFAULT_SITE_CONTENT.seo.title,
      description:
        normalizeVisibleBrandText(mergedSeo.description) || DEFAULT_SITE_CONTENT.seo.description,
    },
    socialLinks: {...DEFAULT_SITE_CONTENT.socialLinks, ...(raw.socialLinks || {})},
    sections: {...DEFAULT_SITE_CONTENT.sections, ...(raw.sections || {})},
    navItems: filteredNav.length > 0 ? filteredNav : DEFAULT_SITE_CONTENT.navItems,
  };
}

// ---------------------------------------------------------------------------
// Public CMS Readers
// ---------------------------------------------------------------------------

export async function getPublishedSiteContent(): Promise<SiteContent> {
  try {
    const snap = await getDoc(doc(db, 'site_content', 'published'));
    if (!snap.exists()) return DEFAULT_SITE_CONTENT;
    return mergeSiteContent(snap.data() as Partial<SiteContent>);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export async function getDraftSiteContent(): Promise<SiteContent> {
  const path = 'site_content/draft';
  try {
    const snap = await getDoc(doc(db, 'site_content', 'draft'));
    if (!snap.exists()) {
      return await getPublishedSiteContent();
    }
    return mergeSiteContent(snap.data() as Partial<SiteContent>);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getPublicServices(): Promise<ServiceOffering[]> {
  try {
    const q = query(collection(db, 'services'), where('enabled', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      return DEFAULT_SERVICES;
    }
    return snap.docs
      .map((d) => d.data() as ServiceOffering)
      .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  } catch {
    return DEFAULT_SERVICES;
  }
}

export async function getAllServicesAdmin(): Promise<ServiceOffering[]> {
  try {
    const snap = await getDocs(collection(db, 'services'));
    if (snap.empty) return DEFAULT_SERVICES;
    return snap.docs
      .map((d) => d.data() as ServiceOffering)
      .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'services');
  }
}

export async function getPricingPlans(): Promise<PricingTier[]> {
  try {
    const snap = await getDocs(collection(db, 'pricing_plans'));
    if (snap.empty) return DEFAULT_PRICING_PLANS;
    return snap.docs
      .map((d) => d.data() as PricingTier)
      .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  } catch {
    return DEFAULT_PRICING_PLANS;
  }
}

export async function getTestimonials(): Promise<TestimonialItem[]> {
  try {
    const snap = await getDocs(collection(db, 'testimonials'));
    if (snap.empty) return DEFAULT_TESTIMONIALS;
    return snap.docs
      .map((d) => {
        const item = d.data() as TestimonialItem;
        return {
          ...item,
          quote: normalizeVisibleBrandText(item.quote),
          outcomeSummary: normalizeVisibleBrandText(item.outcomeSummary),
        };
      })
      .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder));
  } catch {
    return DEFAULT_TESTIMONIALS;
  }
}

export async function getMediaAssets(): Promise<MediaAsset[]> {
  try {
    const snap = await getDocs(collection(db, 'media_assets'));
    if (snap.empty) return DEFAULT_MEDIA_ASSETS;
    return snap.docs.map((d) => d.data() as MediaAsset);
  } catch {
    return DEFAULT_MEDIA_ASSETS;
  }
}

// ---------------------------------------------------------------------------
// Admin CMS Seeding, Draft, Publish & CRUD
// ---------------------------------------------------------------------------

export async function seedInitialCmsIfNeeded(): Promise<void> {
  try {
    const pubRef = doc(db, 'site_content', 'published');
    const pubSnap = await getDoc(pubRef);
    const batch = writeBatch(db);
    let hasWrites = false;

    if (!pubSnap.exists()) {
      batch.set(pubRef, sanitizeSiteContentForWrite(DEFAULT_SITE_CONTENT));
      batch.set(doc(db, 'site_content', 'draft'), sanitizeSiteContentForWrite(DEFAULT_SITE_CONTENT));
      hasWrites = true;
    } else {
      const draftRef = doc(db, 'site_content', 'draft');
      const draftSnap = await getDoc(draftRef);
      if (!draftSnap.exists()) {
        batch.set(
          draftRef,
          sanitizeSiteContentForWrite(mergeSiteContent(pubSnap.data() as Partial<SiteContent>))
        );
        hasWrites = true;
      }
    }

    const svcSnap = await getDocs(collection(db, 'services'));
    if (svcSnap.empty) {
      for (const svc of DEFAULT_SERVICES) {
        batch.set(doc(db, 'services', svc.id), sanitizeServiceForWrite(svc));
      }
      hasWrites = true;
    }

    const planSnap = await getDocs(collection(db, 'pricing_plans'));
    if (planSnap.empty) {
      for (const plan of DEFAULT_PRICING_PLANS) {
        batch.set(doc(db, 'pricing_plans', plan.id), sanitizePricingForWrite(plan));
      }
      hasWrites = true;
    }

    const testSnap = await getDocs(collection(db, 'testimonials'));
    if (testSnap.empty) {
      for (const t of DEFAULT_TESTIMONIALS) {
        batch.set(doc(db, 'testimonials', t.id), sanitizeTestimonialForWrite(t));
      }
      hasWrites = true;
    }

    const mediaSnap = await getDocs(collection(db, 'media_assets'));
    if (mediaSnap.empty) {
      for (const asset of DEFAULT_MEDIA_ASSETS) {
        batch.set(doc(db, 'media_assets', asset.id), {
          id: asset.id,
          label: asset.label,
          category: asset.category,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          url: asset.url,
          sizeLabel: asset.sizeLabel,
          createdAt: serverTimestamp(),
        });
      }
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'cms_seed');
  }
}

export async function saveDraftSiteContent(content: SiteContent): Promise<void> {
  try {
    await setDoc(doc(db, 'site_content', 'draft'), sanitizeSiteContentForWrite(content));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'site_content/draft');
  }
}

export async function publishSiteContent(content: SiteContent): Promise<void> {
  try {
    const payload = sanitizeSiteContentForWrite(content);
    const batch = writeBatch(db);
    batch.set(doc(db, 'site_content', 'draft'), payload);
    batch.set(doc(db, 'site_content', 'published'), payload);
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'site_content/published');
  }
}

export async function upsertService(service: ServiceOffering): Promise<void> {
  try {
    await setDoc(doc(db, 'services', service.id), sanitizeServiceForWrite(service));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `services/${service.id}`);
  }
}

export async function deleteService(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `services/${id}`);
  }
}

export async function upsertPricingPlan(plan: PricingTier): Promise<void> {
  try {
    await setDoc(doc(db, 'pricing_plans', plan.id), sanitizePricingForWrite(plan));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `pricing_plans/${plan.id}`);
  }
}

export async function deletePricingPlan(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'pricing_plans', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `pricing_plans/${id}`);
  }
}

export async function upsertTestimonial(item: TestimonialItem): Promise<void> {
  try {
    await setDoc(doc(db, 'testimonials', item.id), sanitizeTestimonialForWrite(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `testimonials/${item.id}`);
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
  }
}

// ---------------------------------------------------------------------------
// Media Library Upload & Delete (Server File Storage + Firestore Metadata)
// ---------------------------------------------------------------------------

async function getAdminIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Administrator authentication required.');
  }
  return await user.getIdToken();
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read file payload.'));
      }
    };
    reader.onerror = () => reject(new Error('File read error.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadAdminMedia(
  file: File,
  label: string,
  category: MediaCategory
): Promise<MediaAsset> {
  const token = await getAdminIdToken();
  const dataUrl = await readFileAsDataUrl(file);

  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileName: file.name,
      dataUrl,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'Unable to upload media file.');
  }

  const id = `asset_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const asset: MediaAsset = {
    id,
    label: label.trim() || file.name,
    category,
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    url: payload.url,
    sizeLabel: payload.sizeLabel,
  };

  try {
    await setDoc(doc(db, 'media_assets', id), {
      ...asset,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `media_assets/${id}`);
  }

  return asset;
}

export async function deleteAdminMedia(asset: MediaAsset): Promise<void> {
  if (asset.url.startsWith('/uploads/')) {
    const token = await getAdminIdToken();
    const fileName = asset.url.replace(/^\/uploads\//, '');
    await fetch(`/api/media/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  try {
    await deleteDoc(doc(db, 'media_assets', asset.id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `media_assets/${asset.id}`);
  }
}

// ---------------------------------------------------------------------------
// Public Carrier Registration & Contact Inquiries
// ---------------------------------------------------------------------------

export interface PendingCarrierFile extends UploadedDocument {
  file?: File;
  dataUrl?: string;
}

function dataUrlToBlobParts(dataUrl: string): {bytes: Uint8Array; contentType: string} | null {
  const match = /^data:([^;,]*)(?:;[^;,]*)*;base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const contentType = (match[1] || 'application/octet-stream').toLowerCase();
  const binary = atob(match[2].replace(/\s+/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return {bytes, contentType};
}

let cachedBucketStatus: {bucket: string; available: boolean; checkedAt: number} | null = null;

async function isFirebaseStorageBucketAvailable(): Promise<boolean> {
  const bucket = storage.app.options.storageBucket;
  if (!bucket) return false;

  if (
    cachedBucketStatus &&
    cachedBucketStatus.bucket === bucket &&
    Date.now() - cachedBucketStatus.checkedAt < 60_000
  ) {
    return cachedBucketStatus.available;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?maxResults=1`,
      {method: 'GET', signal: controller.signal}
    );
    // 404 means Storage bucket is not provisioned; 200/401/403 means bucket exists
    const available = res.status !== 404;
    cachedBucketStatus = {bucket, available, checkedAt: Date.now()};
    return available;
  } catch {
    cachedBucketStatus = {bucket, available: false, checkedAt: Date.now()};
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function uploadResumableWithTimeout(
  objectPath: string,
  payload: Blob | Uint8Array,
  contentType: string,
  timeoutMs = 12_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef(storage, objectPath), payload, {contentType});
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        task.cancel();
      } catch {
        // Ignore cancel errors
      }
      reject(new Error('Firebase Storage upload timed out.'));
    }, timeoutMs);

    task.on(
      'state_changed',
      undefined,
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      },
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    );
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export interface OTruckingLookupApiResponse {
  found: boolean;
  cached?: boolean;
  lookupType?: 'docket' | 'dot';
  unavailable?: boolean;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
  notFound?: boolean;
  invalidInput?: boolean;
  error?: string;
  mcNumber?: string;
  usdotNumber?: string;
  legalCompanyName?: string;
  dbaName?: string;
  physicalAddress?: string;
  mailingAddress?: string;
  operatingStatus?: string;
  authorityInfo?: string;
  safetyInfo?: string;
  insuranceInfo?: string;
  fleetInfo?: string;
  phone?: string;
  powerUnits?: number;
  source?: string;
  underlyingSources?: string[];
  sourceUpdatedAt?: string;
  disclaimer?: string;
  timestamp?: string;
}

export async function lookupCarrierViaOTrucking(
  type: 'docket' | 'dot',
  value: string
): Promise<OTruckingLookupApiResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 16_000);
  try {
    const params = new URLSearchParams({type, value: value.trim()});
    const res = await fetch(`/api/otrucking/lookup?${params.toString()}`, {
      signal: controller.signal,
    });
    const json = (await res.json().catch(() => ({}))) as Partial<OTruckingLookupApiResponse>;
    return {
      found: Boolean(json.found && res.ok),
      cached: Boolean(json.cached),
      lookupType: json.lookupType || type,
      unavailable: Boolean(json.unavailable || res.status >= 500),
      rateLimited: Boolean(json.rateLimited || res.status === 429),
      retryAfterSeconds: json.retryAfterSeconds,
      notFound: Boolean(json.notFound || res.status === 404),
      invalidInput: Boolean(json.invalidInput || res.status === 400),
      error: json.error,
      mcNumber: json.mcNumber,
      usdotNumber: json.usdotNumber,
      legalCompanyName: json.legalCompanyName,
      dbaName: json.dbaName,
      physicalAddress: json.physicalAddress,
      mailingAddress: json.mailingAddress,
      operatingStatus: json.operatingStatus,
      authorityInfo: json.authorityInfo,
      safetyInfo: json.safetyInfo,
      insuranceInfo: json.insuranceInfo,
      fleetInfo: json.fleetInfo,
      phone: json.phone,
      powerUnits: json.powerUnits,
      source: json.source,
      underlyingSources: json.underlyingSources,
      sourceUpdatedAt: json.sourceUpdatedAt,
      disclaimer: json.disclaimer,
      timestamp: json.timestamp,
    };
  } catch (err) {
    return {
      found: false,
      unavailable: true,
      error:
        err instanceof Error && err.name === 'AbortError'
          ? 'O Trucking lookup timed out. Please retry or use manual entry below.'
          : 'O Trucking carrier lookup service is unreachable. Please retry or use manual entry below.',
    };
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeCarrierLookupSnapshot(
  raw?: Partial<CarrierLookupSnapshot> | null
): CarrierLookupSnapshot {
  const status =
    raw?.lookupStatus === 'verified' ||
    raw?.lookupStatus === 'manual' ||
    raw?.lookupStatus === 'not_found'
      ? raw.lookupStatus
      : 'not_run';
  return {
    performed: Boolean(raw?.performed),
    lookupStatus: status,
    source: String(raw?.source || '').trim().slice(0, 240),
    sourceUpdatedAt: String(raw?.sourceUpdatedAt || '').trim().slice(0, 64),
    timestamp: String(raw?.timestamp || '').trim().slice(0, 64),
    dbaName: String(raw?.dbaName || '').trim().slice(0, 160),
    operatingStatus: String(raw?.operatingStatus || '').trim().slice(0, 160),
    authorityInfo: String(raw?.authorityInfo || '').trim().slice(0, 500),
    safetyInfo: String(raw?.safetyInfo || '').trim().slice(0, 400),
    insuranceInfo: String(raw?.insuranceInfo || '').trim().slice(0, 500),
    fleetInfo: String(raw?.fleetInfo || '').trim().slice(0, 160),
    usdotNumber: String(raw?.usdotNumber || '').trim().slice(0, 40),
    legalName: String(raw?.legalName || '').trim().slice(0, 160),
    physicalAddress: String(raw?.physicalAddress || '').trim().slice(0, 240),
    mailingAddress: String(raw?.mailingAddress || '').trim().slice(0, 240),
  };
}

export async function submitCarrierRegistration(input: {
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  mcNumber: string;
  dotNumber: string;
  physicalAddress: string;
  mailingAddress: string;
  carrierLookup?: CarrierLookupSnapshot;
  equipmentType: string;
  truckCount: number;
  operatingRegions: string[];
  factoringCompany: string;
  insuranceActive: boolean;
  selectedPlan: string;
  notes: string;
  pendingFiles: PendingCarrierFile[];
  onProgress?: (stage: string) => void;
}): Promise<CarrierApplication> {
  const id = `car_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const referenceCode = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;
  const filesToUpload = input.pendingFiles.slice(0, 6);
  const uploadedDocs: UploadedDocument[] = [];

  if (filesToUpload.length > 0) {
    const bucketAvailable = await isFirebaseStorageBucketAvailable();

    for (let idx = 0; idx < filesToUpload.length; idx++) {
      const item = filesToUpload[idx];
      if (!item.file && !item.dataUrl) continue;

      input.onProgress?.(`Uploading document ${idx + 1} of ${filesToUpload.length}...`);

      const cleanName = item.fileName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .slice(0, 100);
      const storageFileName = `${idx + 1}_${Date.now()}_${cleanName || 'document.pdf'}`;
      const objectPath = `carrier_documents/${id}/${storageFileName}`;
      let storedViaFirebase = false;

      // 1. Primary path: upload compliance document directly to Firebase Storage if provisioned
      if (bucketAvailable) {
        try {
          let uploadPayload: Blob | Uint8Array | null = null;
          let contentType = 'application/pdf';

          if (item.file) {
            uploadPayload = item.file;
            contentType = item.file.type || 'application/pdf';
          } else if (item.dataUrl) {
            const parsed = dataUrlToBlobParts(item.dataUrl);
            if (parsed) {
              uploadPayload = parsed.bytes;
              contentType = parsed.contentType;
            }
          }

          if (uploadPayload) {
            await uploadResumableWithTimeout(objectPath, uploadPayload, contentType, 12_000);
            uploadedDocs.push({
              id: item.id,
              storagePath: objectPath,
              storageBucket: storage.app.options.storageBucket || undefined,
              storageProvider: 'firebase-storage',
              docType: item.docType,
              fileName: item.fileName,
              sizeLabel: item.sizeLabel,
              uploadedAt: item.uploadedAt,
            });
            storedViaFirebase = true;
          }
        } catch {
          storedViaFirebase = false;
        }
      }

      // 2. Fallback path: private admin-authenticated server vault (data/carrier_docs/)
      if (!storedViaFirebase) {
        let dataUrl = item.dataUrl;
        if (!dataUrl && item.file) {
          dataUrl = await readFileAsDataUrl(item.file);
        }
        if (!dataUrl) {
          throw new Error(`Unable to read ${item.fileName} for upload.`);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15_000);
        try {
          const res = await fetch('/api/carrier-docs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              fileName: item.fileName,
              dataUrl,
            }),
            signal: controller.signal,
          });
          const json = (await res.json().catch(() => ({}))) as {
            error?: string;
            docId?: string;
            fileName?: string;
            sizeLabel?: string;
          };
          if (!res.ok || !json.docId) {
            throw new Error(json.error || `Failed to upload ${item.fileName}`);
          }
          uploadedDocs.push({
            id: item.id,
            docId: json.docId,
            storageProvider: 'private-vault',
            docType: item.docType,
            fileName: json.fileName || item.fileName,
            sizeLabel: json.sizeLabel || item.sizeLabel,
            uploadedAt: item.uploadedAt,
          });
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            throw new Error(`Upload timed out for ${item.fileName}. Please try again.`);
          }
          throw err;
        } finally {
          clearTimeout(timer);
        }
      }
    }
  }

  input.onProgress?.('Saving carrier registration to Firestore...');

  const safeRegions = input.operatingRegions
    .map((r) => String(r).trim())
    .filter(Boolean)
    .slice(0, 10);

  const docPayload = {
    id,
    referenceCode,
    companyName: input.companyName.trim().slice(0, 160),
    ownerName: input.ownerName.trim().slice(0, 120),
    email: input.email.trim().slice(0, 140),
    phone: input.phone.trim().slice(0, 40),
    mcNumber: input.mcNumber.trim().slice(0, 40),
    dotNumber: input.dotNumber.trim().slice(0, 40),
    physicalAddress: input.physicalAddress.trim().slice(0, 240),
    mailingAddress: input.mailingAddress.trim().slice(0, 240),
    carrierLookup: sanitizeCarrierLookupSnapshot(input.carrierLookup),
    equipmentType: (input.equipmentType.trim() || 'Dry Van').slice(0, 50),
    truckCount: Math.min(500, Math.max(1, Math.round(Number(input.truckCount) || 1))),
    operatingRegions: safeRegions.length > 0 ? safeRegions : ['48-State OTR'],
    factoringCompany: (input.factoringCompany.trim() || 'Direct / None').slice(0, 120),
    insuranceActive: Boolean(input.insuranceActive),
    selectedPlan: (input.selectedPlan.trim() || 'Owner-Operator Standard').slice(0, 120),
    notes: input.notes.trim().slice(0, 1000),
    documents: uploadedDocs,
    status: 'Pending Review' as CarrierStatus,
    submittedAt: serverTimestamp(),
  };

  try {
    await withTimeout(
      setDoc(doc(db, 'carriers', id), docPayload),
      15_000,
      'Saving your registration to the database timed out. Please check your connection and try again.'
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('timed out')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.CREATE, `carriers/${id}`);
  }

  return {
    ...docPayload,
    submittedAt: new Date().toISOString(),
  };
}

export async function submitContactInquiry(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<ContactInquiry> {
  const id = `inq_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  const docPayload = {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    status: 'Open' as InquiryStatus,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'inquiries', id), docPayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `inquiries/${id}`);
  }

  return {
    ...docPayload,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Admin-Only Carriers, Inquiries, Loads & Secure Document Download
// ---------------------------------------------------------------------------

export async function getCarriersAdmin(): Promise<CarrierApplication[]> {
  try {
    const snap = await getDocs(collection(db, 'carriers'));
    return snap.docs
      .map((d) => d.data() as CarrierApplication)
      .sort((a, b) => toMillis(b.submittedAt) - toMillis(a.submittedAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'carriers');
  }
}

export function subscribeCarriersAdmin(
  onUpdate: (carriers: CarrierApplication[]) => void,
  onError: (err: unknown) => void
): () => void {
  return onSnapshot(
    collection(db, 'carriers'),
    (snap) => {
      const list = snap.docs
        .map((d) => d.data() as CarrierApplication)
        .sort((a, b) => toMillis(b.submittedAt) - toMillis(a.submittedAt));
      onUpdate(list);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, 'carriers');
      } catch (wrapped) {
        onError(wrapped);
      }
    }
  );
}

export async function updateCarrierStatusAdmin(
  carrier: CarrierApplication,
  status: CarrierStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'carriers', carrier.id), {status});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `carriers/${carrier.id}`);
  }
}

export async function updateCarrierAdmin(
  carrierId: string,
  updates: Partial<
    Pick<
      CarrierApplication,
      | 'companyName'
      | 'ownerName'
      | 'email'
      | 'phone'
      | 'mcNumber'
      | 'dotNumber'
      | 'physicalAddress'
      | 'mailingAddress'
      | 'equipmentType'
      | 'truckCount'
      | 'operatingRegions'
      | 'factoringCompany'
      | 'insuranceActive'
      | 'selectedPlan'
      | 'notes'
      | 'status'
    >
  >
): Promise<void> {
  try {
    await updateDoc(doc(db, 'carriers', carrierId), updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `carriers/${carrierId}`);
  }
}

export async function deleteCarrierAdmin(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'carriers', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `carriers/${id}`);
  }
}

export async function downloadCarrierDocSecure(docItem: UploadedDocument): Promise<void> {
  await getAdminIdToken();

  let blob: Blob;
  if (docItem.storagePath) {
    blob = await getBlob(storageRef(storage, docItem.storagePath));
  } else if (docItem.docId) {
    const token = await getAdminIdToken();
    const res = await fetch(`/api/carrier-docs/${encodeURIComponent(docItem.docId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error('Document unavailable or unauthorized.');
    }
    blob = await res.blob();
  } else {
    throw new Error('Document file reference is missing.');
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = docItem.fileName || docItem.docId || 'carrier-document';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function getInquiriesAdmin(): Promise<ContactInquiry[]> {
  try {
    const snap = await getDocs(collection(db, 'inquiries'));
    return snap.docs
      .map((d) => d.data() as ContactInquiry)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'inquiries');
  }
}

export async function updateInquiryStatusAdmin(id: string, status: InquiryStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'inquiries', id), {status});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `inquiries/${id}`);
  }
}

export async function deleteInquiryAdmin(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `inquiries/${id}`);
  }
}

export async function getLoadsAdmin(): Promise<DispatchLoad[]> {
  try {
    const snap = await getDocs(collection(db, 'loads'));
    return snap.docs.map((d) => d.data() as DispatchLoad);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'loads');
  }
}

export async function upsertLoadAdmin(load: DispatchLoad): Promise<void> {
  try {
    await setDoc(doc(db, 'loads', load.id), sanitizeLoadForWrite(load));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `loads/${load.id}`);
  }
}

export async function updateLoadStatusAdmin(id: string, status: LoadStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'loads', id), {status});
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `loads/${id}`);
  }
}

export async function deleteLoadAdmin(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'loads', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `loads/${id}`);
  }
}

export function toMillis(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    try {
      return (value as {toMillis: () => number}).toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    return Number((value as {seconds: number}).seconds) * 1000;
  }
  return 0;
}

export function formatFirestoreDate(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return 'Recent';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFirestoreDateTime(value: unknown): string {
  const ms = toMillis(value);
  if (!ms) return 'Just now';
  return new Date(ms).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
