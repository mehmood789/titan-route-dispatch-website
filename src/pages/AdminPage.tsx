import React, {useCallback, useEffect, useState} from 'react';
import {
  Building2,
  CheckCircle2,
  DollarSign,
  Eye,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  Lock,
  LogOut,
  Mail,
  MessageSquareQuote,
  Palette,
  Save,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import {AdminBrandingMediaTab} from '../components/admin/AdminBrandingMediaTab.tsx';
import {AdminCollectionsTab} from '../components/admin/AdminCollectionsTab.tsx';
import {AdminOperationsTab} from '../components/admin/AdminOperationsTab.tsx';
import {AdminSiteContentTab} from '../components/admin/AdminSiteContentTab.tsx';
import {useCms} from '../context/CmsContext.tsx';
import {
  getInquiriesAdmin,
  getLoadsAdmin,
  subscribeCarriersAdmin,
} from '../lib/cmsService.ts';
import {sanitizeUiError} from '../lib/firebase.ts';
import type {
  CarrierApplication,
  ContactInquiry,
  DispatchLoad,
  PageRoute,
} from '../types.ts';

type AdminTab =
  | 'overview'
  | 'logo'
  | 'media'
  | 'homepage'
  | 'services'
  | 'pricing'
  | 'testimonials'
  | 'company'
  | 'carriers'
  | 'contacts'
  | 'design'
  | 'loads';

interface AdminPageProps {
  onNavigate: (page: PageRoute) => void;
}

const TAB_TITLES: Record<AdminTab, string> = {
  overview: 'Operations Overview',
  logo: '1. Logo Management',
  media: '2. Image & Media Library',
  homepage: '3. Homepage Editor',
  services: '4. Services Management',
  pricing: '5. Pricing Management',
  testimonials: '6. Testimonial Management',
  company: '7. Company Information',
  carriers: '8. Carrier Management',
  contacts: '9. Contact Management',
  design: '10. Design, Nav & SEO Settings',
  loads: 'Active Dispatch Loads',
};

export const AdminPage: React.FC<AdminPageProps> = ({onNavigate}) => {
  const {
    user,
    authReady,
    isAdmin,
    authError,
    loginWithGoogle,
    logoutAdmin,
    activeContent,
    hasUnsavedDraft,
    isPreviewMode,
    setPreviewMode,
    saveDraft,
    publishDraft,
  } = useCms();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [carriers, setCarriers] = useState<CarrierApplication[]>([]);
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loads, setLoads] = useState<DispatchLoad[]>([]);
  const [opsLoading, setOpsLoading] = useState(false);

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadOperationalData = useCallback(async () => {
    if (!authReady || !isAdmin) return;
    setOpsLoading(true);
    try {
      const [i, l] = await Promise.all([
        getInquiriesAdmin(),
        getLoadsAdmin(),
      ]);
      setInquiries(i);
      setLoads(l);
    } catch (err) {
      setErrorMsg(sanitizeUiError(err, 'Unable to fetch operational records.'));
    } finally {
      setOpsLoading(false);
    }
  }, [authReady, isAdmin]);

  useEffect(() => {
    if (!authReady || !isAdmin) {
      setCarriers([]);
      return;
    }

    loadOperationalData();
    const unsubscribeCarriers = subscribeCarriersAdmin(
      (nextCarriers) => {
        setCarriers(nextCarriers);
      },
      (err) => {
        setErrorMsg(sanitizeUiError(err, 'Unable to sync carrier registrations.'));
      }
    );

    return () => {
      unsubscribeCarriers();
    };
  }, [authReady, isAdmin, loadOperationalData]);

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      await saveDraft();
      setStatusMsg('Draft saved. Use "Preview Live Site" to review before publishing.');
    } catch (err) {
      setErrorMsg(sanitizeUiError(err, 'Unable to save draft.'));
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setErrorMsg('');
    setStatusMsg('');
    try {
      await publishDraft();
      setPreviewMode(false);
      setStatusMsg('Published live! All public visitors now see the updated website.');
    } catch (err) {
      setErrorMsg(sanitizeUiError(err, 'Unable to publish changes.'));
    } finally {
      setPublishing(false);
    }
  };

  const handlePreviewSite = () => {
    setPreviewMode(true);
    onNavigate('home');
  };

  // Private Admin Authentication Gate
  if (!authReady) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#050F1C] text-white">
        <div className="text-sm text-[#AEBBC9]">Verifying administrator session...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-[#050F1C] px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#081B32] p-8 text-white shadow-2xl">
          <div className="flex items-center justify-center">
            <div className="rounded-xl bg-white px-5 py-2.5">
              <img
                src={activeContent.logoUrl}
                alt={activeContent.companyName}
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold tracking-wider text-[#D52B35]">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>PRIVATE ADMINISTRATOR CONSOLE</span>
          </div>

          <h1 className="mt-2 text-center font-display text-2xl font-bold">
            Titan Route Dispatch CMS
          </h1>
          <p className="mt-2 text-center text-sm text-[#AEBBC9]">
            Sign in with an authorized administrator Google account to manage site content, pricing, media, and carrier packets.
          </p>

          {authError && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-red-400/40 bg-red-950/60 px-4 py-3 text-xs font-medium text-red-200"
            >
              {authError}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#D52B35] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#B81F28] cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Sign In With Google</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={logoutAdmin}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-xs font-semibold text-[#AEBBC9] hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-[#AEBBC9]/80">
            Public admin registration is disabled. Access is restricted strictly to verified administrators.
          </p>
        </div>
      </div>
    );
  }

  const navGroups: {
    group: string;
    items: {id: AdminTab; label: string; icon: React.ComponentType<{className?: string}>}[];
  }[] = [
    {
      group: 'Operations & Leads',
      items: [
        {id: 'overview', label: 'Overview', icon: LayoutDashboard},
        {id: 'carriers', label: `Carrier Management (${carriers.length})`, icon: Users},
        {id: 'contacts', label: `Contacts (${inquiries.length})`, icon: Mail},
        {id: 'loads', label: `Active Loads (${loads.length})`, icon: Truck},
      ],
    },
    {
      group: 'Website CMS Modules',
      items: [
        {id: 'logo', label: 'Logo & Favicon', icon: ShieldCheck},
        {id: 'media', label: 'Image Library', icon: ImageIcon},
        {id: 'homepage', label: 'Homepage Editor', icon: LayoutTemplate},
        {id: 'services', label: 'Services', icon: Wrench},
        {id: 'pricing', label: 'Pricing Plans', icon: DollarSign},
        {id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote},
        {id: 'company', label: 'Company Info', icon: Building2},
        {id: 'design', label: 'Design & SEO', icon: Palette},
      ],
    },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F8FAFC]">
      <div className="mx-auto flex max-w-[1440px] flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 border-b border-slate-200 bg-[#050F1C] text-white lg:w-[260px] lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-140px)]">
          <div className="border-b border-white/10 p-5">
            <div className="text-xs font-medium text-[#AEBBC9]">Authorized Admin</div>
            <div className="mt-0.5 truncate font-display text-xs font-semibold text-white">
              TRD Operations CMS
            </div>
          </div>

          <nav className="p-3 space-y-5" aria-label="Admin Console Navigation">
            {navGroups.map((group) => (
              <div key={group.group}>
                <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#AEBBC9]/70">
                  {group.group}
                </div>
                <div className="flex gap-1 overflow-x-auto lg:flex-col">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setStatusMsg('');
                          setErrorMsg('');
                        }}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-[#D52B35] text-white font-semibold'
                            : 'text-[#AEBBC9] hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={logoutAdmin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-[#AEBBC9] hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <div className="flex-1 p-5 sm:p-8">
          {/* Module 11: Preview & Publish Top Bar */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 xl:flex-row xl:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>TRD Private CMS</span>
                <span aria-hidden="true">/</span>
                <span className="font-semibold text-[#081B32]">{TAB_TITLES[activeTab]}</span>
                {hasUnsavedDraft && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                    Unsaved Draft Changes
                  </span>
                )}
              </div>
              <h1 className="mt-1 font-display text-2xl font-bold text-[#081B32]">
                {TAB_TITLES[activeTab]}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={savingDraft}
                onClick={handleSaveDraft}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-[#081B32] hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{savingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={handlePreviewSite}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                  isPreviewMode
                    ? 'border-[#081B32] bg-[#081B32] text-white'
                    : 'border-[#081B32] bg-white text-[#081B32] hover:bg-slate-50'
                }`}
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Preview Changes</span>
              </button>

              <button
                type="button"
                disabled={publishing}
                onClick={handlePublish}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D52B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F28] disabled:opacity-60 cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{publishing ? 'Publishing...' : 'Publish Live'}</span>
              </button>
            </div>
          </div>

          {statusMsg && (
            <div
              role="status"
              className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A34A]" aria-hidden="true" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800"
            >
              {errorMsg}
            </div>
          )}

          {(activeTab === 'overview' ||
            activeTab === 'carriers' ||
            activeTab === 'contacts' ||
            activeTab === 'loads') &&
            (opsLoading ? (
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((k) => (
                  <div
                    key={k}
                    className="h-14 w-full animate-pulse rounded-lg border border-slate-200 bg-white"
                  />
                ))}
              </div>
            ) : (
              <AdminOperationsTab
                mode={activeTab}
                carriers={carriers}
                inquiries={inquiries}
                loads={loads}
                onReload={loadOperationalData}
                onStatus={setStatusMsg}
                onError={setErrorMsg}
              />
            ))}

          {(activeTab === 'logo' || activeTab === 'media') && (
            <AdminBrandingMediaTab
              mode={activeTab}
              onStatus={setStatusMsg}
              onError={setErrorMsg}
            />
          )}

          {(activeTab === 'homepage' || activeTab === 'company' || activeTab === 'design') && (
            <AdminSiteContentTab mode={activeTab} onStatus={setStatusMsg} />
          )}

          {(activeTab === 'services' ||
            activeTab === 'pricing' ||
            activeTab === 'testimonials') && (
            <AdminCollectionsTab
              mode={activeTab}
              onStatus={setStatusMsg}
              onError={setErrorMsg}
            />
          )}
        </div>
      </div>
    </div>
  );
};
