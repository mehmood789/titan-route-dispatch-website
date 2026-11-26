import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
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
  authBusy: boolean;
  isAdmin: boolean;
  authError: string;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
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

interface AdminVerificationResult {
  authorized: boolean;
  error?: string;
}

function formatFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as {code?: unknown}).code || '')
      : '';
  const msg = err instanceof Error ? err.message : String(err || '');

  if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
    return '';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-email'
  ) {
    return 'Invalid administrator email or password.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled in Firebase Authentication. Enable it in Firebase Console or use Sign In With Google below.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many failed sign-in attempts. Wait a few minutes before trying again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Authentication. Add this domain under Firebase Console → Authentication → Settings → Authorized domains.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the Google sign-in popup. Allow popups for this site or sign in with your administrator email and password.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error while contacting Firebase Authentication. Please check your connection and try again.';
  }
  return 'Authentication failed. Please verify your administrator credentials and try again.';
}

async function verifyServerAdminSession(user: User): Promise<AdminVerificationResult> {
  if (!user.emailVerified) {
    return {
      authorized: false,
      error:
        'Your administrator email is not marked verified in Firebase Authentication. Verify your email or sign in with Google.',
    };
  }

  try {
    const token = await user.getIdToken(true);
    const res = await fetch('/api/auth/admin-status', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        authorized: false,
        error:
          'Administrator verification endpoint (/api/auth/admin-status) did not return JSON. Verify the Worker API routing.',
      };
    }

    const data = (await res.json()) as {authorized?: boolean; error?: string};
    if (res.ok && data.authorized) {
      return {authorized: true};
    }
    if (res.status === 403) {
      return {
        authorized: false,
        error: 'Access denied. This account is not authorized for administrator access.',
      };
    }
    return {
      authorized: false,
      error: data.error || 'Unable to verify administrator session. Please sign in again.',
    };
  } catch {
    return {
      authorized: false,
      error: 'Unable to reach administrator verification service. Please try again.',
    };
  }
}

export const CmsProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState('');
  const loginInProgressRef = useRef(false);

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
    let active = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        await auth.authStateReady();
      } catch {
        // Ignore authStateReady failure and continue with listener
      }
      if (!active) return;

      unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
        if (!active) return;

        // Avoid race condition while an explicit login flow is actively verifying the user
        if (loginInProgressRef.current) {
          setUser(nextUser);
          return;
        }

        setUser(nextUser);
        if (!nextUser) {
          setIsAdmin(false);
          setAuthReady(true);
          return;
        }

        const check = await verifyServerAdminSession(nextUser);
        if (!active) return;
        setIsAdmin(check.authorized);
        if (!check.authorized) {
          setAuthError(
            check.error || 'Access denied. This account is not authorized for administrator access.'
          );
        } else {
          setAuthError('');
        }
        setAuthReady(true);
      });
    })();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAdmin) {
      refreshAdminCms().catch((err) => {
        console.error('Failed loading admin CMS:', err);
      });
    }
  }, [isAdmin, refreshAdminCms]);

  const completeSignIn = useCallback(async (signedUser: User) => {
    const check = await verifyServerAdminSession(signedUser);
    if (!check.authorized) {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setAuthError(
        check.error || 'Access denied. This account is not authorized for administrator access.'
      );
      return;
    }
    setUser(signedUser);
    setIsAdmin(true);
    setAuthError('');
    setAuthReady(true);
  }, []);

  const loginWithEmailPassword = useCallback(
    async (emailInput: string, passwordInput: string) => {
      const trimmedEmail = emailInput.trim();
      if (!trimmedEmail || !passwordInput) {
        setAuthError('Enter your administrator email and password.');
        return;
      }

      setAuthError('');
      setAuthBusy(true);
      loginInProgressRef.current = true;
      try {
        const result = await signInWithEmailAndPassword(auth, trimmedEmail, passwordInput);
        await completeSignIn(result.user);
      } catch (err) {
        const formatted = formatFirebaseAuthError(err);
        if (formatted) {
          setAuthError(formatted);
        }
      } finally {
        loginInProgressRef.current = false;
        setAuthBusy(false);
      }
    },
    [completeSignIn]
  );

  const loginWithGoogle = useCallback(async () => {
    setAuthError('');
    setAuthBusy(true);
    loginInProgressRef.current = true;
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      await completeSignIn(result.user);
    } catch (err) {
      const formatted = formatFirebaseAuthError(err);
      if (formatted) {
        setAuthError(formatted);
      }
    } finally {
      loginInProgressRef.current = false;
      setAuthBusy(false);
    }
  }, [completeSignIn]);

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
        authBusy,
        isAdmin,
        authError,
        loginWithEmailPassword,
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
