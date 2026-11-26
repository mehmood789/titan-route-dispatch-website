import React from 'react';
import {RotateCcw} from 'lucide-react';
import {useCms} from '../../context/CmsContext.tsx';
import {DEFAULT_SITE_CONTENT} from '../../lib/cmsDefaults.ts';
import type {PageRoute} from '../../types.ts';

interface AdminSiteContentTabProps {
  mode: 'homepage' | 'company' | 'design';
  onStatus: (msg: string) => void;
}

const FONT_OPTIONS = [
  'Plus Jakarta Sans',
  'DM Sans',
  'Inter',
  'Montserrat',
  'Barlow',
  'Space Grotesk',
  'Roboto',
];

const CTA_PAGE_OPTIONS: {label: string; value: PageRoute}[] = [
  {label: 'Carrier Registration', value: 'register'},
  {label: 'Contact Dispatch', value: 'contact'},
  {label: 'Services & Calculator', value: 'services'},
  {label: 'Pricing Plans', value: 'pricing'},
  {label: 'Testimonials', value: 'testimonials'},
];

export const AdminSiteContentTab: React.FC<AdminSiteContentTabProps> = ({mode, onStatus}) => {
  const {draftContent, setDraftContent, setHasUnsavedDraft, mediaAssets} = useCms();

  const updateField = <K extends keyof typeof draftContent>(
    key: K,
    value: (typeof draftContent)[K]
  ) => {
    setDraftContent((prev) => ({...prev, [key]: value}));
    setHasUnsavedDraft(true);
  };

  if (mode === 'homepage') {
    return (
      <div className="mt-6 space-y-6">
        {/* Hero & Welcome Animation Text */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
          <h2 className="font-display text-base font-bold text-[#081B32]">
            Hero Banner &amp; Welcome Intro Copy
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Main Headline</label>
              <input
                type="text"
                value={draftContent.heroHeadline}
                onChange={(e) => updateField('heroHeadline', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-[#081B32]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Main Subtitle</label>
              <textarea
                rows={3}
                value={draftContent.heroSubheadline}
                onChange={(e) => updateField('heroSubheadline', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-[#081B32]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Primary Button Label
              </label>
              <input
                type="text"
                value={draftContent.heroPrimaryCtaLabel}
                onChange={(e) => updateField('heroPrimaryCtaLabel', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Primary Button Destination
              </label>
              <select
                value={draftContent.heroPrimaryCtaPage}
                onChange={(e) => updateField('heroPrimaryCtaPage', e.target.value as PageRoute)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
              >
                {CTA_PAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Secondary Button Label
              </label>
              <input
                type="text"
                value={draftContent.heroSecondaryCtaLabel}
                onChange={(e) => updateField('heroSecondaryCtaLabel', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Secondary Button Destination
              </label>
              <select
                value={draftContent.heroSecondaryCtaPage}
                onChange={(e) => updateField('heroSecondaryCtaPage', e.target.value as PageRoute)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
              >
                {CTA_PAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Welcome Animation Title
              </label>
              <input
                type="text"
                value={draftContent.welcomeHeadline}
                onChange={(e) => updateField('welcomeHeadline', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Welcome Animation Slogan
              </label>
              <input
                type="text"
                value={draftContent.welcomeSlogan}
                onChange={(e) => updateField('welcomeSlogan', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Hero Background / Truck Image
              </label>
              <select
                value={draftContent.heroImage}
                onChange={(e) => updateField('heroImage', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
              >
                {mediaAssets
                  .filter((m) => m.category !== 'logo' && m.category !== 'favicon')
                  .map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Operations Section Image
              </label>
              <select
                value={draftContent.operationsImage}
                onChange={(e) => updateField('operationsImage', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
              >
                {mediaAssets
                  .filter((m) => m.category !== 'logo' && m.category !== 'favicon')
                  .map((m) => (
                    <option key={m.id} value={m.url}>
                      {m.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Operations & Final CTA Section Copy */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#081B32]">
            Operations Highlight &amp; Bottom CTA Band
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Operations Section Headline
            </label>
            <input
              type="text"
              value={draftContent.operationsTitle}
              onChange={(e) => updateField('operationsTitle', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Operations Description
            </label>
            <textarea
              rows={2}
              value={draftContent.operationsDescription}
              onChange={(e) => updateField('operationsDescription', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Bottom CTA Headline
              </label>
              <input
                type="text"
                value={draftContent.ctaTitle}
                onChange={(e) => updateField('ctaTitle', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Bottom CTA Subtitle
              </label>
              <input
                type="text"
                value={draftContent.ctaSubtitle}
                onChange={(e) => updateField('ctaSubtitle', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Show / Hide Homepage Sections */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-bold text-[#081B32]">
            Homepage Section Visibility
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Show or hide individual sections on the public homepage.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {key: 'showMetrics' as const, label: 'Operational Metrics Strip'},
              {key: 'showServices' as const, label: 'Equipment Services Grid'},
              {key: 'showOperations' as const, label: 'Operations & Credit Vetting'},
              {key: 'showTestimonials' as const, label: 'Featured Carrier Reviews'},
              {key: 'showCtaBand' as const, label: 'Bottom Registration CTA Band'},
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-[#F8FAFC] px-4 py-3 text-sm font-medium text-[#081B32] cursor-pointer"
              >
                <span>{item.label}</span>
                <input
                  type="checkbox"
                  checked={draftContent.sections[item.key]}
                  onChange={(e) =>
                    updateField('sections', {
                      ...draftContent.sections,
                      [item.key]: e.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-[#D52B35]"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'company') {
    return (
      <div className="mt-6 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#081B32]">
            Company Contact &amp; Footer Details
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Company Legal Name</label>
              <input
                type="text"
                value={draftContent.companyName}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Short Brand Title</label>
              <input
                type="text"
                value={draftContent.shortName}
                onChange={(e) => updateField('shortName', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Website Domain</label>
              <input
                type="text"
                value={draftContent.domain}
                onChange={(e) => updateField('domain', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Company Slogan</label>
              <input
                type="text"
                value={draftContent.slogan}
                onChange={(e) => updateField('slogan', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Primary Email</label>
              <input
                type="email"
                value={draftContent.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={draftContent.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                WhatsApp Number (digits with country code)
              </label>
              <input
                type="text"
                value={draftContent.whatsappNumber}
                onChange={(e) => updateField('whatsappNumber', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Office Address</label>
              <input
                type="text"
                value={draftContent.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Dispatch Hours</label>
              <input
                type="text"
                value={draftContent.hours}
                onChange={(e) => updateField('hours', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Footer Description</label>
              <textarea
                rows={2}
                value={draftContent.footerText}
                onChange={(e) => updateField('footerText', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#081B32]">Social Media Links</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(
              [
                {key: 'facebook', label: 'Facebook URL'},
                {key: 'instagram', label: 'Instagram URL'},
                {key: 'linkedin', label: 'LinkedIn URL'},
                {key: 'x', label: 'X (Twitter) URL'},
              ] as const
            ).map((soc) => (
              <div key={soc.key}>
                <label className="block text-xs font-semibold text-slate-700">{soc.label}</label>
                <input
                  type="url"
                  value={draftContent.socialLinks[soc.key]}
                  onChange={(e) =>
                    updateField('socialLinks', {
                      ...draftContent.socialLinks,
                      [soc.key]: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Design, Typography, Navigation, & SEO
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-[#081B32]">
              Website Color Palette
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Customize Deep Navy, Professional Red, White, Silver Grey, and Dark Background colors.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              updateField('colors', DEFAULT_SITE_CONTENT.colors);
              onStatus('Restored official Titan Route Dispatch (TRD) LLC Navy/Red/Silver palette in draft.');
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#081B32] hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Brand Colors</span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              {key: 'deepNavy', label: 'Deep Navy'},
              {key: 'professionalRed', label: 'Professional Red'},
              {key: 'white', label: 'Surface White'},
              {key: 'silverGrey', label: 'Silver Grey'},
              {key: 'darkBackground', label: 'Dark Background'},
            ] as const
          ).map((colorItem) => (
            <div
              key={colorItem.key}
              className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-3"
            >
              <label className="block text-xs font-semibold text-slate-700">
                {colorItem.label}
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={draftContent.colors[colorItem.key]}
                  onChange={(e) =>
                    updateField('colors', {
                      ...draftContent.colors,
                      [colorItem.key]: e.target.value,
                    })
                  }
                  className="h-9 w-10 rounded border border-slate-300 bg-white cursor-pointer"
                />
                <input
                  type="text"
                  value={draftContent.colors[colorItem.key]}
                  onChange={(e) =>
                    updateField('colors', {
                      ...draftContent.colors,
                      [colorItem.key]: e.target.value,
                    })
                  }
                  className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 font-mono text-xs uppercase"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography & Navigation */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-[#081B32]">Typography</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Headings &amp; Display Font
            </label>
            <select
              value={draftContent.typography.displayFont}
              onChange={(e) =>
                updateField('typography', {
                  ...draftContent.typography,
                  displayFont: e.target.value,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700">Body Font</label>
            <select
              value={draftContent.typography.bodyFont}
              onChange={(e) =>
                updateField('typography', {
                  ...draftContent.typography,
                  bodyFont: e.target.value,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <h2 className="font-display text-base font-bold text-[#081B32]">
            Header Navigation Menu
          </h2>
          {draftContent.navItems.map((nav, idx) => (
            <div
              key={nav.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-[#F8FAFC] px-3 py-2"
            >
              <input
                type="text"
                value={nav.label}
                onChange={(e) => {
                  const next = draftContent.navItems.map((item, i) =>
                    i === idx ? {...item, label: e.target.value} : item
                  );
                  updateField('navItems', next);
                }}
                className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm font-medium"
              />
              <span className="font-mono text-xs text-slate-500">/{nav.page}</span>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nav.visible}
                  onChange={(e) => {
                    const next = draftContent.navItems.map((item, i) =>
                      i === idx ? {...item, visible: e.target.checked} : item
                    );
                    updateField('navItems', next);
                  }}
                  className="h-4 w-4 accent-[#D52B35]"
                />
                <span>Show</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* SEO & Social Sharing */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-display text-base font-bold text-[#081B32]">
          SEO Titles, Descriptions &amp; Social Sharing Image
        </h2>
        <div>
          <label className="block text-xs font-semibold text-slate-700">Browser &amp; SEO Title</label>
          <input
            type="text"
            value={draftContent.seo.title}
            onChange={(e) =>
              updateField('seo', {...draftContent.seo, title: e.target.value})
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            SEO Meta Description
          </label>
          <textarea
            rows={2}
            value={draftContent.seo.description}
            onChange={(e) =>
              updateField('seo', {...draftContent.seo, description: e.target.value})
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700">
            Social Sharing (OpenGraph) Image
          </label>
          <select
            value={draftContent.seo.ogImage}
            onChange={(e) =>
              updateField('seo', {...draftContent.seo, ogImage: e.target.value})
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
          >
            {mediaAssets.map((m) => (
              <option key={m.id} value={m.url}>
                {m.label} ({m.url})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
