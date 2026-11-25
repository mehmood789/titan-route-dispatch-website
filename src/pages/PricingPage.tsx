import React from 'react';
import {ArrowRight, Check, Shield} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';

interface PricingPageProps {
  onNavigate: (page: PageRoute, selectedPlan?: string) => void;
}

const COMPARISON_ROWS = [
  {
    feature: 'Minimum Weekly Fee',
    standard: '$0 (pay only when loaded)',
    fleet: '$0 (pay only when loaded)',
    enterprise: 'Custom SLA',
  },
  {
    feature: 'Contract Lock-In',
    standard: 'Week-to-week · Cancel anytime',
    fleet: 'Week-to-week · Cancel anytime',
    enterprise: '90-day dedicated pod SLA',
  },
  {
    feature: 'Load Approval Control',
    standard: '100% carrier sign-off',
    fleet: '100% carrier sign-off',
    enterprise: '100% carrier sign-off',
  },
  {
    feature: 'Broker Credit Vetting',
    standard: 'Ansonia + Factoring check',
    fleet: 'Ansonia + Factoring check',
    enterprise: 'Custom credit limit rules',
  },
  {
    feature: 'Detention / TONU / Lumper Claims',
    standard: 'Filed & 100% kept by carrier',
    fleet: 'Filed & 100% kept by carrier',
    enterprise: 'Escalated recovery desk',
  },
];

export const PricingPage: React.FC<PricingPageProps> = ({onNavigate}) => {
  const {activeContent, pricingPlans} = useCms();
  const {colors} = activeContent;

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="py-14 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <span>Transparent Percentage Billing</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span style={{color: colors.professionalRed}}>Zero Setup Fees</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl text-balance max-w-3xl">
            Simple Dispatch Pricing Tied Directly to Your Gross Revenue
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed" style={{color: colors.silverGrey}}>
            We earn only when your wheels are moving. No hidden onboarding fees, no long-term lock-in contracts, and zero forced loads.
          </p>
        </div>
      </section>

      {/* Pricing Cards (Live from Firestore CMS) */}
      <section className="py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pricingPlans.map((tier) => {
              const isHighlighted = Boolean(tier.highlighted);
              return (
                <div
                  key={tier.id}
                  className={`flex flex-col justify-between rounded-xl p-6 sm:p-7 ${
                    isHighlighted ? 'border-2 text-white' : 'border border-slate-200 bg-[#F8FAFC]'
                  }`}
                  style={
                    isHighlighted
                      ? {borderColor: colors.professionalRed, backgroundColor: colors.deepNavy}
                      : {color: colors.deepNavy}
                  }
                >
                  <div>
                    <div
                      className="text-xs font-semibold"
                      style={{
                        color: isHighlighted ? colors.professionalRed : '#64748B',
                      }}
                    >
                      {tier.audience} · {tier.truckRange}
                    </div>
                    <h2 className="mt-2 font-display text-2xl font-bold">{tier.name}</h2>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-mono text-4xl font-bold tabular-nums">
                        {tier.rateLabel}
                      </span>
                      <span
                        className="text-xs"
                        style={{color: isHighlighted ? colors.silverGrey : '#475569'}}
                      >
                        {tier.rateSubtext}
                      </span>
                    </div>

                    <p
                      className="mt-4 text-sm leading-relaxed"
                      style={{color: isHighlighted ? colors.silverGrey : '#475569'}}
                    >
                      {tier.description}
                    </p>

                    <dl
                      className={`mt-6 space-y-3 border-t pt-5 text-sm ${
                        isHighlighted ? 'border-white/15' : 'border-slate-200'
                      }`}
                    >
                      {tier.limits.map((lim) => (
                        <div key={lim.label} className="flex items-center justify-between gap-4">
                          <dt
                            className="flex items-center gap-2"
                            style={{color: isHighlighted ? colors.silverGrey : '#475569'}}
                          >
                            <Check
                              className="h-4 w-4 shrink-0"
                              style={{color: colors.professionalRed}}
                              aria-hidden="true"
                            />
                            <span>{lim.label}</span>
                          </dt>
                          <dd className="font-medium text-right">{lim.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('register', tier.name)}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                    style={{
                      backgroundColor: isHighlighted ? colors.professionalRed : colors.deepNavy,
                    }}
                  >
                    <span>{tier.ctaLabel || `Select ${tier.name}`}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plan Comparison Matrix */}
      <section className="border-t border-slate-200 bg-[#F8FAFC] py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="font-display text-2xl font-bold" style={{color: colors.deepNavy}}>
            Plan Deliverables &amp; Terms Comparison
          </h2>
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Capability / Limit</th>
                  {pricingPlans.map((tier) => (
                    <th
                      key={tier.id}
                      className="px-5 py-3.5"
                      style={tier.highlighted ? {color: colors.professionalRed} : undefined}
                    >
                      {tier.name} ({tier.rateLabel})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-medium" style={{color: colors.deepNavy}}>
                      {row.feature}
                    </td>
                    {pricingPlans.map((tier, idx) => (
                      <td
                        key={tier.id}
                        className={`px-5 py-3.5 ${
                          idx === 1 ? 'font-medium' : 'text-slate-600'
                        }`}
                        style={idx === 1 ? {color: colors.deepNavy} : undefined}
                      >
                        {idx === 0 ? row.standard : idx === 1 ? row.fleet : row.enterprise}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Shield
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{color: colors.professionalRed}}
                aria-hidden="true"
              />
              <div>
                <h3 className="font-display text-base font-bold" style={{color: colors.deepNavy}}>
                  Weekly Invoicing via Your Factoring or Direct ACH
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Brokers pay you or your factoring company directly—{activeContent.companyName} never touches your load settlement funds.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('contact')}
              className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              style={{borderColor: colors.professionalRed, color: colors.professionalRed}}
            >
              Ask Billing Question
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
