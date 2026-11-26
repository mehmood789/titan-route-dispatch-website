import {useCallback, useEffect, useState} from 'react';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {Footer} from './components/Footer.tsx';
import {Header} from './components/Header.tsx';
import {WelcomeSplash} from './components/WelcomeSplash.tsx';
import {CmsProvider, useCms} from './context/CmsContext.tsx';
import {AboutUsPage} from './pages/AboutUsPage.tsx';
import {AdminPage} from './pages/AdminPage.tsx';
import {ContactPage} from './pages/ContactPage.tsx';
import {DisclaimerPage} from './pages/DisclaimerPage.tsx';
import {HomePage} from './pages/HomePage.tsx';
import {PricingPage} from './pages/PricingPage.tsx';
import {PrivacyPolicyPage} from './pages/PrivacyPolicyPage.tsx';
import {RegisterPage} from './pages/RegisterPage.tsx';
import {ServicesPage} from './pages/ServicesPage.tsx';
import {TermsPage} from './pages/TermsPage.tsx';
import {TestimonialsPage} from './pages/TestimonialsPage.tsx';
import type {PageRoute} from './types.ts';

const VALID_PAGES: PageRoute[] = [
  'home',
  'services',
  'pricing',
  'testimonials',
  'register',
  'contact',
  'contact-us',
  'about-us',
  'privacy-policy',
  'terms-and-conditions',
  'disclaimer',
  'admin',
];

const ROUTE_PATHS: Record<PageRoute, string> = {
  home: '/',
  services: '/services',
  pricing: '/pricing',
  testimonials: '/testimonials',
  register: '/register',
  contact: '/contact',
  'contact-us': '/contact-us',
  'about-us': '/about-us',
  'privacy-policy': '/privacy-policy',
  'terms-and-conditions': '/terms-and-conditions',
  disclaimer: '/disclaimer',
  admin: '/admin',
};

const ROUTE_SEO: Partial<
  Record<PageRoute, {title: string; description: string; canonicalPath?: string}>
> = {
  'about-us': {
    title: 'About Us | Titan Route Dispatch (TRD) LLC',
    description:
      'Learn about Titan Route Dispatch (TRD) LLC, an independent US truck dispatch provider supporting Hotshot, Power Only, Box Truck, Dry Van, Reefer, and Flatbed carriers.',
  },
  'contact-us': {
    title: 'Contact Us | Titan Route Dispatch (TRD) LLC',
    description:
      'Contact Titan Route Dispatch (TRD) LLC for 24/7 dispatch support, carrier onboarding questions, fleet pricing, and broker inquiries.',
  },
  contact: {
    title: 'Contact Us | Titan Route Dispatch (TRD) LLC',
    description:
      'Contact Titan Route Dispatch (TRD) LLC for 24/7 dispatch support, carrier onboarding questions, fleet pricing, and broker inquiries.',
    canonicalPath: '/contact-us',
  },
  'privacy-policy': {
    title: 'Privacy Policy | Titan Route Dispatch (TRD) LLC',
    description:
      'Read how Titan Route Dispatch (TRD) LLC collects, uses, secures, and shares carrier onboarding data, compliance documents, cookies, and Google AdSense disclosures.',
  },
  'terms-and-conditions': {
    title: 'Terms and Conditions | Titan Route Dispatch (TRD) LLC',
    description:
      'Review the Terms and Conditions governing website access and independent freight dispatch services provided by Titan Route Dispatch (TRD) LLC.',
  },
  disclaimer: {
    title: 'Disclaimer | Titan Route Dispatch (TRD) LLC',
    description:
      'Important operational and regulatory disclaimers for Titan Route Dispatch (TRD) LLC, public carrier data lookups, and website information.',
  },
  services: {
    title: 'Dispatch Services | Titan Route Dispatch (TRD) LLC',
    description:
      'Dedicated US truck dispatch services from Titan Route Dispatch (TRD) LLC for Hotshot, Power Only, Box Truck, Dry Van, Reefer, and Flatbed motor carriers.',
  },
  pricing: {
    title: 'Dispatch Pricing Plans | Titan Route Dispatch (TRD) LLC',
    description:
      'Transparent freight dispatch percentage and flat-rate plans from Titan Route Dispatch (TRD) LLC for owner-operators and multi-truck fleets.',
  },
  testimonials: {
    title: 'Carrier Reviews | Titan Route Dispatch (TRD) LLC',
    description:
      'Read real-world dispatch outcomes from independent owner-operators and fleets working with Titan Route Dispatch (TRD) LLC.',
  },
  register: {
    title: 'Carrier Registration | Titan Route Dispatch (TRD) LLC',
    description:
      'Register your MC/USDOT carrier authority and upload required compliance documents securely with Titan Route Dispatch (TRD) LLC.',
  },
  admin: {
    title: 'Administrator Console | Titan Route Dispatch (TRD) LLC',
    description: 'Restricted operations console for Titan Route Dispatch (TRD) LLC.',
  },
};

function getInitialRoute(): PageRoute {
  const pathSeg = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (VALID_PAGES.includes(pathSeg as PageRoute)) {
    return pathSeg as PageRoute;
  }
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (VALID_PAGES.includes(hash as PageRoute)) {
    return hash as PageRoute;
  }
  return 'home';
}

function upsertHeadTag(
  selector: string,
  createEl: () => HTMLElement,
  applyAttrs: (el: HTMLElement) => void
) {
  let el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = createEl();
    document.head.appendChild(el);
  }
  applyAttrs(el);
}

function AppShell() {
  const {activeContent} = useCms();
  const [currentPage, setCurrentPage] = useState<PageRoute>(getInitialRoute);
  const [showWelcome, setShowWelcome] = useState(() => getInitialRoute() === 'home');
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);

  const navigate = useCallback((page: PageRoute, plan?: string) => {
    setCurrentPage(page);
    if (plan) {
      setSelectedPlan(plan);
    }
    const targetPath = ROUTE_PATHS[page] || '/';
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  useEffect(() => {
    const onRouteChange = () => {
      setCurrentPage(getInitialRoute());
    };
    window.addEventListener('hashchange', onRouteChange);
    window.addEventListener('popstate', onRouteChange);
    return () => {
      window.removeEventListener('hashchange', onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
    };
  }, []);

  // Synchronize per-route SEO title, description, robots directive, and canonical URL
  useEffect(() => {
    const isRestricted = currentPage === 'admin';
    const routeSeo = ROUTE_SEO[currentPage];
    const title = routeSeo?.title || activeContent.seo.title;
    const description = routeSeo?.description || activeContent.seo.description;
    const canonicalPath = routeSeo?.canonicalPath || ROUTE_PATHS[currentPage] || '/';
    const canonicalDomain = activeContent.domain || 'trdispatch.us';
    const canonicalUrl = `https://${canonicalDomain}${canonicalPath}`;

    if (title) {
      document.title = title;
      upsertHeadTag(
        'meta[property="og:title"]',
        () => {
          const m = document.createElement('meta');
          m.setAttribute('property', 'og:title');
          return m;
        },
        (el) => el.setAttribute('content', title)
      );
    }

    if (description) {
      upsertHeadTag(
        'meta[name="description"]',
        () => {
          const m = document.createElement('meta');
          m.setAttribute('name', 'description');
          return m;
        },
        (el) => el.setAttribute('content', description)
      );
      upsertHeadTag(
        'meta[property="og:description"]',
        () => {
          const m = document.createElement('meta');
          m.setAttribute('property', 'og:description');
          return m;
        },
        (el) => el.setAttribute('content', description)
      );
    }

    upsertHeadTag(
      'meta[name="robots"]',
      () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'robots');
        return m;
      },
      (el) => el.setAttribute('content', isRestricted ? 'noindex, nofollow' : 'index, follow')
    );

    upsertHeadTag(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      },
      (el) => el.setAttribute('href', canonicalUrl)
    );
  }, [currentPage, activeContent.domain, activeContent.seo.title, activeContent.seo.description]);

  const handleReplayIntro = () => {
    setShowWelcome(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#081B32]">
      <WelcomeSplash visible={showWelcome} onComplete={() => setShowWelcome(false)} />

      <Header currentPage={currentPage} onNavigate={(page) => navigate(page)} />

      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={(page) => navigate(page)} />}
        {currentPage === 'about-us' && <AboutUsPage onNavigate={(page) => navigate(page)} />}
        {currentPage === 'services' && <ServicesPage onNavigate={(page) => navigate(page)} />}
        {currentPage === 'pricing' && (
          <PricingPage onNavigate={(page, plan) => navigate(page, plan)} />
        )}
        {currentPage === 'testimonials' && (
          <TestimonialsPage onNavigate={(page) => navigate(page)} />
        )}
        {currentPage === 'register' && (
          <RegisterPage initialPlan={selectedPlan} onNavigate={(page) => navigate(page)} />
        )}
        {(currentPage === 'contact' || currentPage === 'contact-us') && (
          <ContactPage onNavigate={(page) => navigate(page)} />
        )}
        {currentPage === 'privacy-policy' && (
          <PrivacyPolicyPage onNavigate={(page) => navigate(page)} />
        )}
        {currentPage === 'terms-and-conditions' && (
          <TermsPage onNavigate={(page) => navigate(page)} />
        )}
        {currentPage === 'disclaimer' && <DisclaimerPage onNavigate={(page) => navigate(page)} />}
        {currentPage === 'admin' && <AdminPage onNavigate={(page) => navigate(page)} />}
      </main>

      <Footer onNavigate={(page) => navigate(page)} onReplayIntro={handleReplayIntro} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <CmsProvider>
        <AppShell />
      </CmsProvider>
    </ErrorBoundary>
  );
}
