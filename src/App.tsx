import {useCallback, useEffect, useState} from 'react';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {Footer} from './components/Footer.tsx';
import {Header} from './components/Header.tsx';
import {WelcomeSplash} from './components/WelcomeSplash.tsx';
import {CmsProvider} from './context/CmsContext.tsx';
import {AdminPage} from './pages/AdminPage.tsx';
import {ContactPage} from './pages/ContactPage.tsx';
import {HomePage} from './pages/HomePage.tsx';
import {PricingPage} from './pages/PricingPage.tsx';
import {RegisterPage} from './pages/RegisterPage.tsx';
import {ServicesPage} from './pages/ServicesPage.tsx';
import {TestimonialsPage} from './pages/TestimonialsPage.tsx';
import type {PageRoute} from './types.ts';

const VALID_PAGES: PageRoute[] = [
  'home',
  'services',
  'pricing',
  'testimonials',
  'register',
  'contact',
  'admin',
];

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

function AppShell() {
  const [currentPage, setCurrentPage] = useState<PageRoute>(getInitialRoute);
  const [showWelcome, setShowWelcome] = useState(() => getInitialRoute() !== 'admin');
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined);

  const navigate = useCallback((page: PageRoute, plan?: string) => {
    setCurrentPage(page);
    if (plan) {
      setSelectedPlan(plan);
    }
    if (page === 'admin') {
      window.history.replaceState(null, '', '/admin');
    } else {
      window.history.replaceState(null, '', page === 'home' ? '/' : `/#/${page}`);
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

  const handleReplayIntro = () => {
    setShowWelcome(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#081B32]">
      <WelcomeSplash visible={showWelcome} onComplete={() => setShowWelcome(false)} />

      <Header currentPage={currentPage} onNavigate={(page) => navigate(page)} />

      <main className="flex-1">
        {currentPage === 'home' && <HomePage onNavigate={(page) => navigate(page)} />}
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
        {currentPage === 'contact' && <ContactPage />}
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
