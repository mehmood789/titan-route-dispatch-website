import React from 'react';
import {ArrowRight, CheckCircle2, MessageCircle, ShieldCheck} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import {KEY_METRICS} from '../lib/cmsDefaults.ts';
import type {PageRoute} from '../types.ts';
import {ResilientImage} from '../components/ResilientImage.tsx';
import {BoldBrandText} from '../components/BoldBrandText.tsx';

interface HomePageProps {
  onNavigate: (page: PageRoute) => void;
}

export const HomePage: React.FC<HomePageProps> = ({onNavigate}) => {
  const {activeContent, services, testimonials} = useCms();
  const {colors, sections} = activeContent;
  const featuredTestimonials = testimonials.slice(0, 2);

  const whatsappClean = activeContent.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
    `Hello ${activeContent.companyName}, I want to onboard my truck for freight dispatch.`
  )}`;

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <div
                className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider"
                style={{color: colors.silverGrey}}
              >
                <strong className="font-bold text-white">{activeContent.companyName}</strong>
                <span aria-hidden="true">·</span>
                <span>48-State Authority Support</span>
                <span aria-hidden="true">·</span>
                <span style={{color: colors.professionalRed}}>No Forced Dispatch</span>
              </div>

              <h1
                className="font-display font-extrabold tracking-tight text-white text-balance"
                style={{fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', lineHeight: 1.07}}
              >
                {activeContent.heroHeadline}
              </h1>

              <p
                className="mt-3 font-display text-xs font-bold tracking-[0.15em] sm:text-sm"
                style={{color: colors.professionalRed}}
              >
                {activeContent.slogan}
              </p>

              <p
                className="mt-4 max-w-xl text-base leading-relaxed"
                style={{color: colors.silverGrey}}
              >
                <BoldBrandText text={activeContent.heroSubheadline} strongClassName="font-bold text-white" />
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => onNavigate(activeContent.heroPrimaryCtaPage || 'register')}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
                  style={{backgroundColor: colors.professionalRed}}
                >
                  <span>{activeContent.heroPrimaryCtaLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(activeContent.heroSecondaryCtaPage || 'contact')}
                  className="inline-flex items-center rounded-lg border px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 whitespace-nowrap shrink-0 cursor-pointer"
                  style={{borderColor: `${colors.silverGrey}66`}}
                >
                  {activeContent.heroSecondaryCtaLabel}
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div
                className="relative h-full min-h-[290px] overflow-hidden rounded-xl border border-white/15"
                style={{backgroundColor: colors.deepNavy}}
              >
                <video
                  src="/hero-truck.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="h-full w-full object-cover lg:h-full"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, ${colors.darkBackground}CC, transparent, transparent)`,
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white">
                  <span className="font-medium">
                    {services.map((s) => s.equipment).join(' · ')}
                  </span>
                  <span
                    className="font-mono tabular-nums font-semibold"
                    style={{color: colors.professionalRed}}
                  >
                    24/7 US Operations
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Column Operational Metrics Strip */}
          {sections.showMetrics && (
            <div className="mt-10 grid grid-cols-1 gap-4 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {KEY_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-lg border border-white/10 px-5 py-4"
                  style={{backgroundColor: colors.deepNavy}}
                >
                  <div className="font-mono text-2xl font-bold text-white tabular-nums">
                    {metric.value}
                  </div>
                  <div
                    className="mt-1 text-sm font-semibold"
                    style={{color: colors.professionalRed}}
                  >
                    {metric.label}
                  </div>
                  <p className="mt-0.5 text-xs" style={{color: colors.silverGrey}}>
                    {metric.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. Individual Equipment Service Visual Cards */}
      {sections.showServices && (
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold tracking-wide" style={{color: colors.professionalRed}}>
                  Specialized Freight Divisions
                </p>
                <h2
                  className="mt-2 font-display text-3xl font-bold tracking-tight text-balance"
                  style={{color: colors.deepNavy}}
                >
                  Dedicated Dispatch Across Every US Equipment Class
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={{color: colors.deepNavy}}
              >
                <span>View all capabilities &amp; rate estimator</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article
                  key={service.id}
                  className="flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-slate-400"
                >
                  <div>
                    <div
                      className="h-48 w-full overflow-hidden border-b border-slate-200"
                      style={{backgroundColor: colors.deepNavy}}
                    >
                      <ResilientImage
                        src={service.image}
                        alt={service.imageAlt || service.title}
                        className="h-full w-full object-cover"
                        fallbackTitle={service.title}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold" style={{color: colors.professionalRed}}>
                          {service.equipment}
                        </span>
                        <span
                          className="font-mono tabular-nums font-medium"
                          style={{color: colors.deepNavy}}
                        >
                          {service.targetRpm}
                        </span>
                      </div>
                      <h3
                        className="mt-2 font-display text-lg font-bold"
                        style={{color: colors.deepNavy}}
                      >
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {service.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3.5 text-xs">
                    <span className="font-mono tabular-nums text-slate-600">
                      Gross: {service.avgWeeklyGross}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('register')}
                      className="font-semibold hover:opacity-80 cursor-pointer"
                      style={{color: colors.professionalRed}}
                    >
                      Book Loads →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Trust-Building Operations Center & Compliance Guarantee */}
      {sections.showOperations && (
        <section className="border-t border-slate-200 bg-[#F8FAFC] py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div
              className="grid grid-cols-1 items-stretch gap-8 rounded-xl p-6 text-white sm:p-8 lg:grid-cols-12"
              style={{backgroundColor: colors.deepNavy}}
            >
              <div className="flex flex-col justify-center lg:col-span-6">
                <div
                  className="text-xs font-semibold tracking-wide"
                  style={{color: colors.professionalRed}}
                >
                  Established US Logistics Operations
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl text-balance">
                  {activeContent.operationsTitle}
                </h2>
                <p
                  className="mt-3 text-sm leading-relaxed sm:text-base"
                  style={{color: colors.silverGrey}}
                >
                  <BoldBrandText text={activeContent.operationsDescription} strongClassName="font-bold text-white" />
                </p>

                <ul className="mt-5 space-y-2.5 text-sm text-slate-200">
                  {[
                    '100% carrier sign-off on every rate confirmation',
                    'Immediate detention, layover, and TONU claim filing',
                    'Direct WhatsApp & phone line to your assigned dispatcher',
                  ].map((point) => (
                    <li key={point} className="flex items-center gap-2.5">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{color: colors.professionalRed}}
                        aria-hidden="true"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('pricing')}
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                    style={{backgroundColor: colors.professionalRed}}
                  >
                    View Dispatch Pricing
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    <MessageCircle
                      className="h-4 w-4"
                      style={{color: colors.professionalRed}}
                      aria-hidden="true"
                    />
                    <span>WhatsApp Dispatch</span>
                  </a>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-white/15 min-h-[250px] lg:col-span-6">
                <ResilientImage
                  src={activeContent.operationsImage}
                  alt={`${activeContent.companyName} operations floor monitoring US interstate corridors`}
                  className="h-full w-full object-cover"
                  fallbackTitle={`${activeContent.companyName} Operations Center`}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Claim-to-Proof Carrier Testimonials */}
      {sections.showTestimonials && featuredTestimonials.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p
                  className="text-xs font-semibold tracking-wide"
                  style={{color: colors.professionalRed}}
                >
                  Verified Carrier Outcomes
                </p>
                <h2
                  className="mt-2 font-display text-3xl font-bold tracking-tight text-balance"
                  style={{color: colors.deepNavy}}
                >
                  Trusted by Independent Fleets Nationwide
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('testimonials')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                style={{color: colors.deepNavy}}
              >
                <span>Read all carrier stories</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
              {featuredTestimonials.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold" style={{color: colors.deepNavy}}>
                          {item.company}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{item.mcNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.equipment}</span>
                      </div>
                      {item.photoUrl && item.permissionGranted && (
                        <img
                          src={item.photoUrl}
                          alt={item.driverName}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      )}
                    </div>

                    <p className="mt-4 text-base leading-relaxed text-slate-700">
                      “<BoldBrandText text={item.quote} strongClassName="font-bold text-slate-900" />”
                    </p>
                  </div>

                  <div className="mt-6 border-t border-slate-200 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="font-semibold" style={{color: colors.deepNavy}}>
                        {item.driverName} — {item.role}
                      </div>
                      <div
                        className="font-mono tabular-nums font-semibold"
                        style={{color: colors.professionalRed}}
                      >
                        {item.beforeMetric} → {item.afterMetric}
                      </div>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-600">{item.outcomeSummary}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Final CTA Band */}
      {sections.showCtaBand && (
        <section className="bg-[#F8FAFC] py-14 border-t border-slate-200">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div
              className="flex flex-col items-start justify-between gap-6 rounded-xl px-6 py-10 text-white sm:px-10 lg:flex-row lg:items-center"
              style={{backgroundColor: colors.darkBackground}}
            >
              <div className="max-w-2xl">
                <div
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{color: colors.professionalRed}}
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Fast Carrier Activation</span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance">
                  {activeContent.ctaTitle}
                </h2>
                <p className="mt-2 text-sm sm:text-base" style={{color: colors.silverGrey}}>
                  {activeContent.ctaSubtitle}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap cursor-pointer"
                  style={{backgroundColor: colors.professionalRed}}
                >
                  <span>Register Carrier</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="inline-flex items-center rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 whitespace-nowrap cursor-pointer"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
