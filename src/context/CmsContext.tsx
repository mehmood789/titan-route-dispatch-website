import React, {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  DEFAULT_MEDIA_ASSETS,
  DEFAULT_PRICING_PLANS,
  DEFAULT_SERVICES,
  DEFAULT_SITE_CONTENT,
  DEFAULT_TESTIMONIALS,
} from '../lib/cmsDefaults.ts';
import {
  getAllServicesAdmin,
  getDraftSiteContent,
  getMediaAssets,
  getPricingPlans,
  getPublishedSiteContent,
  getPublicServices,
  getTestimonials,
  publishSiteContent,
  saveDraftSiteContent,
  seedInitialCmsIfNeeded,
} from '../lib/cmsService.ts';
import {auth, googleAuthProvider} from '../lib/firebase.ts';
import type {
  MediaAsset,
  PricingTier,
  ServiceOffering,
  SiteContent,
  TestimonialItem,
} from '../types.ts';

interface CmsContextValue {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  authError: string;
  loginWithGoogle: () => Promise<void>;
  logoutAdmin: () => Promise<void>;

  publishedContent: SiteContent;
  draftContent: SiteContent;
  setDraftContent: React.Dispatch<React.SetStateAction<SiteContent>>;
  activeContent: SiteContent;

  isPreviewMode: boolean;
  setPreviewMode: (enabled: boolean) => void;
  hasUnsavedDraft: boolean;
  setHasUnsavedDraft: (dirty: boolean) => void;

  services: ServiceOffering[];
  allServicesAdmin: ServiceOffering[];
  pricingPlans: PricingTier[];
  testimonials: TestimonialItem[];
  mediaAssets: MediaAsset[];

  cmsLoading: boolean;
  saveDraft: (override?: SiteContent) => Promise<void>;
  publishDraft: (override?: SiteContent) => Promise<void>;
  refreshPublicCms: () => Promise<void>;
  refreshAdminCms: () => Promise<void>;
}

const CmsContext = createContext<CmsContextValue | null>(null);

const GOOGLE_FONT_MAP: Record<string, string> = {
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@500;600;700;800',
  'DM Sans': 'DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700',
  Inter: 'Inter:wght@400;500;600;700;800',
  Montserrat: 'Montserrat:wght@500;600;700;800',
  Barlow: 'Barlow:wght@500;600;700;800',
  'Space Grotesk': 'Space+Grotesk:wght@500;600;700',
  Roboto: 'Roboto:wght@400;500;700',
};

async function verifyServerAdminSession(user: User): Promise<boolean> {
  if (!user.emailVerified) return false;
  try {
    const token = await user.getIdToken();
    const res = await fetch('/api/auth/admin-status', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {authorized?: boolean};
    return Boolean(data.authorized);
  } catch {
    return false;
  }
}

export const CmsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState('');

  const [publishedContent, setPublishedContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [draftContent, setDraftContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [hasUnsavedDraft, setHasUnsavedDraft] = useState(false);

  const [services, setServices] = useState<ServiceOffering[]>(DEFAULT_SERVICES);
  const [allServicesAdmin, setAllServicesAdmin] = useState<ServiceOffering[]>(DEFAULT_SERVICES);
  const [pricingPlans, setPricingPlans] = useState<PricingTier[]>(DEFAULT_PRICING_PLANS);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(DEFAULT_TESTIMONIALS);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(DEFAULT_MEDIA_ASSETS);
  const [cmsLoading, setCmsLoading] = useState(true);

  const refreshPublicCms = useCallback(async () => {
    setCmsLoading(true);
    try {
      const [pub, pubServices, plans, reviews, media] = await Promise.all([
        getPublishedSiteContent(),
        getPublicServices(),
        getPricingPlans(),
        getTestimonials(),
        getMediaAssets(),
      ]);
      setPublishedContent(pub);
      setServices(pubServices);
      setPricingPlans(plans);
      setTestimonials(reviews);
      setMediaAssets(media);
    } finally {
      setCmsLoading(false);
    }
  }, []);

  const refreshAdminCms = useCallback(async () => {
    if (!isAdmin) return;
    await seedInitialCmsIfNeeded();
    const [pub, draft, allSvc, plans, reviews, media] = await Promise.all([
      getPublishedSiteContent(),
      getDraftSiteContent(),
      getAllServicesAdmin(),
      getPricingPlans(),
      getTestimonials(),
      getMediaAssets(),
    ]);
    setPublishedContent(pub);
    setDraftContent(draft);
    setAllServicesAdmin(allSvc);
    setServices(
      allSvc
        .filter((s) => s.enabled)
        .sort((a, b) => Number(a.displayOrder) - Number(b.displayOrder))
    );
    setPricingPlans(plans);
    setTestimonials(reviews);
    setMediaAssets(media);
  }, [isAdmin]);

  useEffect(() => {
    refreshPublicCms();
  }, [refreshPublicCms]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      const authorized = await verifyServerAdminSession(nextUser);
      setIsAdmin(authorized);
      if (!authorized) {
        setAuthError('Access denied. This account is not authorized for administrator access.');
      } else {
        setAuthError('');
      }
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      refreshAdminCms().catch((err) => {
        console.error('Failed loading admin CMS:', err);
      });
    }
  }, [isAdmin, refreshAdminCms]);

  const loginWithGoogle = useCallback(async () => {
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const signedUser = result.user;
      const authorized = await verifyServerAdminSession(signedUser);
      if (!authorized) {
        await signOut(auth);
        setIsAdmin(false);
        setAuthError('Access denied. This account is not authorized for administrator access.');
      } else {
        setIsAdmin(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in.';
      if (!message.includes('popup-closed-by-user')) {
        setAuthError('Authentication failed. Please try again.');
      }
    }
  }, []);

  const logoutAdmin = useCallback(async () => {
    setPreviewMode(false);
    setIsAdmin(false);
    setAuthError('');
    await signOut(auth);
  }, []);

  const saveDraft = useCallback(
    async (override?: SiteContent) => {
      const next = override || draftContent;
      await saveDraftSiteContent(next);
      setDraftContent(next);
      setHasUnsavedDraft(false);
    },
    [draftContent]
  );

  const publishDraft = useCallback(
    async (override?: SiteContent) => {
      const next = override || draftContent;
      await publishSiteContent(next);
      setDraftContent(next);
      setPublishedContent(next);
      setHasUnsavedDraft(false);
    },
    [draftContent]
  );

  const activeContent = isAdmin && isPreviewMode ? draftContent : publishedContent;

  // Apply dynamic theme CSS variables, fonts, SEO metadata, and favicon
  useEffect(() => {
    const root = document.documentElement;
    const {colors, typography, seo, faviconUrl} = activeContent;

    root.style.setProperty('--trd-navy', colors.deepNavy);
    root.style.setProperty('--trd-red', colors.professionalRed);
    root.style.setProperty('--trd-white', colors.white);
    root.style.setProperty('--trd-silver', colors.silverGrey);
    root.style.setProperty('--trd-dark', colors.darkBackground);

    root.style.setProperty(
      '--font-display',
      `"${typography.displayFont}", system-ui, -apple-system, sans-serif`
    );
    root.style.setProperty(
      '--font-sans',
      `"${typography.bodyFont}", system-ui, -apple-system, sans-serif`
    );

    const fontQueries = [typography.displayFont, typography.bodyFont]
      .map((f) => GOOGLE_FONT_MAP[f])
      .filter(Boolean);
    if (fontQueries.length > 0) {
      let linkEl = document.getElementById('trd-dynamic-fonts') as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = 'trd-dynamic-fonts';
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      const nextHref = `https://fonts.googleapis.com/css2?${fontQueries
        .map((q) => `family=${q}`)
        .join('&')}&display=swap`;
      if (linkEl.href !== nextHref) {
        linkEl.href = nextHref;
      }
    }

    if (seo.title) {
      document.title = seo.title;
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', seo.title);
    }

    if (seo.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', seo.description);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', seo.description);
    }

    if (seo.ogImage) {
      let ogImg = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      ogImg.setAttribute('content', seo.ogImage);
    }

    if (faviconUrl) {
      let iconEl = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!iconEl) {
        iconEl = document.createElement('link');
        iconEl.rel = 'icon';
        document.head.appendChild(iconEl);
      }
      iconEl.href = faviconUrl;
    }
  }, [activeContent]);

  return (
    <CmsContext.Provider
      value={{
        user,
        authReady,
        isAdmin,
        authError,
        loginWithGoogle,
        logoutAdmin,
        publishedContent,
        draftContent,
        setDraftContent,
        activeContent,
        isPreviewMode,
        setPreviewMode,
        hasUnsavedDraft,
        setHasUnsavedDraft,
        services,
        allServicesAdmin,
        pricingPlans,
        testimonials,
        mediaAssets,
        cmsLoading,
        saveDraft,
        publishDraft,
        refreshPublicCms,
        refreshAdminCms,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
};

export function useCms(): CmsContextValue {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCms must be used inside CmsProvider');
  }
  return ctx;
}
