import React from 'react';
import {AlertTriangle, ArrowRight} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';

interface DisclaimerPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const DisclaimerPage: React.FC<DisclaimerPageProps> = ({onNavigate}) => {
  const {activeContent} = useCms();
  const {colors} = activeContent;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, page: PageRoute) => {
    e.preventDefault();
    onNavigate(page);
  };

  return (
    <div className="bg-[#F8FAFC]">
      <section className="py-12 text-white" style={{backgroundColor: colors.darkBackground}}>
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <div className="text-xs font-medium" style={{color: colors.silverGrey}}>
            <strong className="font-bold text-white">{activeContent.companyName}</strong>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span style={{color: colors.professionalRed}}>Regulatory &amp; Operational Notice</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Disclaimer
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{color: colors.silverGrey}}>
            Important disclosures regarding independent dispatch services, FMCSA public data lookups,
            and website information for <strong className="font-bold text-white">{activeContent.companyName}</strong>.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <article className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-10 sm:text-[15px]">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <p>
                <strong className="font-bold">{activeContent.companyName}</strong> is strictly an{' '}
                <span className="font-semibold">independent freight dispatch service provider</span>. We
                are not a U.S. government agency, not a licensed motor carrier, and not a licensed freight
                broker.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                1. Independent Dispatch Role &amp; Scope of Services
              </h2>
              <p>
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> provides
                load coordination, rate negotiation, broker packet preparation, and back-office
                administrative dispatch support exclusively to independent owner-operators and motor
                carriers operating under their own active authority across Hotshot, Power Only, Box Truck,
                Dry Van, Reefer, and Flatbed equipment classes.
              </p>
              <p>
                We do not dispatch loads under our own USDOT or MC authority, do not haul freight, do not
                assume carrier cargo liability, and do not act as a freight broker or shipper agent. All
                transportation agreements and rate confirmations are executed directly between the carrier and
                the broker or shipper.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                2. No Revenue, Rate, or Load Availability Guarantees
              </h2>
              <p>
                Any target rate-per-mile (RPM) ranges, sample weekly gross figures, or carrier testimonials
                published on <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong>{' '}
                are provided solely for general informational purposes. Actual carrier earnings depend
                heavily on freight market cycles, lane geography, equipment specifications, driver
                availability, fuel and maintenance expenses, broker creditworthiness, and seasonal demand.{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> makes no
                guarantee of minimum weekly gross revenue, fixed RPM, or continuous freight availability.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                3. Carrier Lookup &amp; Third-Party Public Data
              </h2>
              <p>
                The MC and USDOT pre-fill lookup available on our carrier registration page queries the{' '}
                <span className="font-medium text-[#081B32]">O Trucking Public Data API</span>, which
                compiles publicly available records attributed to Federal Motor Carrier Safety
                Administration (FMCSA) datasets. Neither{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> nor O
                Trucking is affiliated with, endorsed by, or part of the U.S. Department of Transportation
                or FMCSA.
              </p>
              <p>
                Public records may experience synchronization delays or omissions. Carriers are solely
                responsible for reviewing, verifying, and correcting their legal name, MC/USDOT identifiers,
                physical and mailing addresses, operating status, and insurance details prior to submitting
                an application.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                4. Not Legal, Regulatory, Tax, or Insurance Advice
              </h2>
              <p>
                Information presented across{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong>—including
                compliance document checklists (W-9, MC Authority Letter, Certificate of Insurance, Notice
                of Assignment), onboarding guidance, and operational summaries—is for general business
                coordination only and does not constitute legal, regulatory, DOT safety, tax, accounting,
                or insurance advice. Carriers should consult qualified legal, tax, and insurance
                professionals regarding federal and state operating requirements.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                5. External Links &amp; Advertising Disclosures
              </h2>
              <p>
                This website may contain links to external services (such as WhatsApp or social media
                channels) and may display third-party advertisements served through Google AdSense. Clicking
                third-party links or advertisements directs you to external properties governed by their own
                terms and privacy policies, for which{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> assumes no
                responsibility or endorsement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                6. Questions &amp; Clarifications
              </h2>
              <p>
                If you have questions regarding this Disclaimer or our role as an independent dispatch
                service provider, please reach out to us at{' '}
                <span className="font-medium text-[#081B32]">{activeContent.email}</span> or visit our{' '}
                <a
                  href="/contact-us"
                  onClick={(e) => handleLinkClick(e, 'contact-us')}
                  className="font-semibold underline underline-offset-4"
                  style={{color: colors.professionalRed}}
                >
                  Contact Us
                </a>{' '}
                page.
              </p>
            </section>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
              <a
                href="/terms-and-conditions"
                onClick={(e) => handleLinkClick(e, 'terms-and-conditions')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#081B32] transition-colors hover:bg-slate-50"
              >
                <span>Terms &amp; Conditions</span>
              </a>
              <a
                href="/privacy-policy"
                onClick={(e) => handleLinkClick(e, 'privacy-policy')}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{backgroundColor: colors.professionalRed}}
              >
                <span>Privacy Policy</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
