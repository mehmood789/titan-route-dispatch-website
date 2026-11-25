import React, {useMemo, useState} from 'react';
import {ArrowRight, Quote} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';
import {ResilientImage} from '../components/ResilientImage.tsx';

interface TestimonialsPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const TestimonialsPage: React.FC<TestimonialsPageProps> = ({onNavigate}) => {
  const {activeContent, testimonials} = useCms();
  const {colors} = activeContent;
  const [filter, setFilter] = useState<string>('All');

  const filterTabs = useMemo(() => {
    const unique = Array.from(new Set(testimonials.map((t) => t.equipment).filter(Boolean)));
    return ['All', ...unique];
  }, [testimonials]);

  const visibleTestimonials =
    filter === 'All'
      ? testimonials
      : testimonials.filter((item) => item.equipment === filter);

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="py-14 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <span>Verified MC Carriers</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span style={{color: colors.professionalRed}}>Before &amp; After Performance</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance max-w-3xl">
            How Independent Carriers Grow Weekly Gross With {activeContent.shortName}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{color: colors.silverGrey}}>
            Real operational results from dry van, reefer, flatbed, hotshot, and box truck fleets running under their own authority across 48 states.
          </p>
        </div>
      </section>

      {/* Filter & Testimonials Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h2 className="font-display text-2xl font-bold" style={{color: colors.deepNavy}}>
              Carrier Performance Reports
            </h2>
            <div
              className="inline-flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
              role="group"
              aria-label="Filter testimonials by equipment type"
            >
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    filter === tab ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  style={filter === tab ? {backgroundColor: colors.deepNavy} : undefined}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {visibleTestimonials.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold" style={{color: colors.deepNavy}}>
                        {item.company}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono">{item.mcNumber}</span>
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{color: colors.professionalRed}}
                    >
                      {item.equipment} · {item.homeBase}
                    </span>
                  </div>

                  <Quote
                    className="mt-4 h-6 w-6 opacity-60"
                    style={{color: colors.professionalRed}}
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-base leading-relaxed text-slate-700">
                    “{item.quote}”
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
                    <div>
                      <div className="text-xs text-slate-500">Before TRD</div>
                      <div className="mt-0.5 font-mono text-sm font-semibold text-slate-700 tabular-nums">
                        {item.beforeMetric}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">With TRD</div>
                      <div
                        className="mt-0.5 font-mono text-sm font-bold tabular-nums"
                        style={{color: colors.professionalRed}}
                      >
                        {item.afterMetric}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {item.photoUrl && item.permissionGranted && (
                        <img
                          src={item.photoUrl}
                          alt={item.driverName}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      )}
                      <div className="text-sm font-semibold" style={{color: colors.deepNavy}}>
                        {item.driverName} —{' '}
                        <span className="font-normal text-slate-600">{item.role}</span>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-slate-600">{item.outcomeSummary}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Operations Center Feature Strip */}
      <section className="border-t border-slate-200 bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div
            className="grid grid-cols-1 items-stretch gap-8 rounded-xl p-6 text-white sm:p-8 lg:grid-cols-12"
            style={{backgroundColor: colors.deepNavy}}
          >
            <div className="flex flex-col justify-center lg:col-span-6">
              <h2 className="font-display text-2xl font-bold sm:text-3xl text-balance">
                Behind Every Rate Confirmation Is a Live US Dispatch Desk
              </h2>
              <p
                className="mt-3 text-sm leading-relaxed sm:text-base"
                style={{color: colors.silverGrey}}
              >
                Your dispatcher monitors live lane heatmaps, market RPM shifts, and weather bottlenecks in real time so your truck never lands in a dead freight market without a pre-booked reload.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
                  style={{backgroundColor: colors.professionalRed}}
                >
                  <span>Join Active Carriers</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-white/15 min-h-[240px] lg:col-span-6">
              <ResilientImage
                src={activeContent.operationsImage}
                alt={`${activeContent.companyName} operations desk monitoring US truck routes`}
                className="h-full w-full object-cover"
                fallbackTitle="TRD Operations Center"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
