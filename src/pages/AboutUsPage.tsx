import React from 'react';
import {ArrowRight, CheckCircle2, MessageCircle, ShieldCheck, Truck} from 'lucide-react';
import {ResilientImage} from '../components/ResilientImage.tsx';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';

interface AboutUsPageProps {
  onNavigate: (page: PageRoute) => void;
}

const EQUIPMENT_DIVISIONS = [
  {
    name: 'Hotshot Dispatch',
    detail:
      'Gooseneck LTL and partial-stack coordination across industrial, construction, and oilfield freight lanes.',
  },
  {
    name: 'Power Only Dispatch',
    detail:
      'Consistent drop-and-hook trailer pools and trailer repositioning runs for independent Class-8 tractors.',
  },
  {
    name: 'Box Truck Dispatch',
    detail:
      'Regional and OTR 24ft–26ft straight truck freight, liftgate coordination, and dock window scheduling.',
  },
  {
    name: 'Dry Van Dispatch',
    detail:
      'High-frequency 53-foot palletized retail and CPG corridors structured to reduce empty backhaul miles.',
  },
  {
    name: 'Reefer Dispatch',
    detail:
      'Temperature-controlled produce and cold-chain lanes backed by appointment tracking and lumper follow-up.',
  },
  {
    name: 'Flatbed Dispatch',
    detail:
      'Open-deck steel, lumber, and machinery hauls with tarp-pay negotiation and jobsite delivery coordination.',
  },
];

export const AboutUsPage: React.FC<AboutUsPageProps> = ({onNavigate}) => {
  const {activeContent} = useCms();
  const {colors} = activeContent;

  const whatsappClean = activeContent.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
    `Hello ${activeContent.companyName}, I would like to learn more about your dispatch services.`
  )}`;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: PageRoute) => {
    e.preventDefault();
    onNavigate(page);
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Banner */}
      <section className="py-12 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <strong className="font-bold text-white">{activeContent.companyName}</strong>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span style={{color: colors.professionalRed}}>
              About <strong className="font-bold">{activeContent.companyName}</strong>
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            About <strong className="font-extrabold">{activeContent.companyName}</strong> — Independent Freight Dispatch Built Around Carrier Control
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{color: colors.silverGrey}}>
            <strong className="font-bold text-white">{activeContent.companyName}</strong> provides dedicated back-office dispatch, broker vetting, and lane rate negotiation for American owner-operators and independent motor carriers.
          </p>
        </div>
      </section>

      {/* Company Overview Split */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <div
                className="text-xs font-semibold tracking-wide"
                style={{color: colors.professionalRed}}
              >
                Who We Are
              </div>
              <h2
                className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
                style={{color: colors.deepNavy}}
              >
                A Dedicated Dispatch Desk Behind Every Mile You Run
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                Running under your own MC authority requires balancing freight negotiation, broker credit
                checks, setup packets, detention follow-up, and hours on the road.{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> steps in as an independent dispatch partner so drivers and fleet
                managers can stay focused on safe, profitable highway operations.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                We operate strictly with <span className="font-semibold text-[#081B32]">no forced dispatch</span>.
                Every lane, reload, and rate confirmation is presented to you transparently for your direct
                approval before commitment.
              </p>

              <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
                {[
                  'Independent dispatch provider — you retain 100% control of your authority',
                  'Broker credit screening and setup packet administration before dispatch',
                  'Organized BOL/POD packets ready for your factoring company',
                  'Prompt detention, layover, and TONU paperwork follow-up',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{color: colors.professionalRed}}
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-h-[260px] overflow-hidden rounded-xl border border-slate-200 lg:col-span-6">
              <ResilientImage
                src={activeContent.operationsImage}
                alt={`${activeContent.companyName} carrier dispatch operations`}
                className="h-full w-full object-cover"
                fallbackTitle={activeContent.companyName}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Supported Equipment Divisions */}
      <section className="border-t border-slate-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold tracking-wide" style={{color: colors.professionalRed}}>
              Core Freight Divisions
            </div>
            <h2
              className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl text-balance"
              style={{color: colors.deepNavy}}
            >
              Equipment Classes We Dispatch Nationwide
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Whether you operate a single truck or manage a growing regional fleet across the 48 contiguous
              states, our dispatch desk aligns freight strategy with your trailer configuration.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {EQUIPMENT_DIVISIONS.map((division) => (
              <div
                key={division.name}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 shrink-0" style={{color: colors.professionalRed}} aria-hidden="true" />
                  <h3 className="font-display text-base font-bold" style={{color: colors.deepNavy}}>
                    {division.name}
                  </h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{division.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Independent Business Disclosure & Contact CTA */}
      <section className="border-t border-slate-200 bg-[#F8FAFC] py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div
            className="grid grid-cols-1 items-center gap-8 rounded-xl p-6 text-white sm:p-10 lg:grid-cols-12"
            style={{backgroundColor: colors.deepNavy}}
          >
            <div className="lg:col-span-7">
              <div
                className="flex items-center gap-2 text-xs font-semibold"
                style={{color: colors.professionalRed}}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>Transparent Carrier Support</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl text-balance">
                Ready to Discuss Dispatch Coverage for Your Truck?
              </h2>
              <p className="mt-3 text-sm leading-relaxed" style={{color: colors.silverGrey}}>
                <strong className="font-bold text-white">{activeContent.companyName}</strong> operates strictly as an independent freight dispatch service
                provider—never as a broker or government agency. Reach out to review dispatch options or
                submit your carrier packet online.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                <span>{activeContent.hours}</span>
                <span aria-hidden="true">·</span>
                <span>{activeContent.address}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:col-span-5 lg:justify-end">
              <a
                href="/register"
                onClick={(e) => handleLinkClick(e, 'register')}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                style={{backgroundColor: colors.professionalRed}}
              >
                <span>Register Carrier</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="/contact-us"
                onClick={(e) => handleLinkClick(e, 'contact-us')}
                className="inline-flex items-center justify-center rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 whitespace-nowrap"
              >
                Contact Us
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 whitespace-nowrap"
              >
                <MessageCircle
                  className="h-4 w-4"
                  style={{color: colors.professionalRed}}
                  aria-hidden="true"
                />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
