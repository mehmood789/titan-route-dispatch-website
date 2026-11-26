import React from 'react';
import {ArrowRight, FileCheck2} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';

interface TermsPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({onNavigate}) => {
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
            <span style={{color: colors.professionalRed}}>Service Terms &amp; Conditions</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Terms and Conditions
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{color: colors.silverGrey}}>
            Effective Date: November 26, 2026 ·{' '}
            <strong className="font-bold text-white">{activeContent.companyName}</strong>
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <article className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-10 sm:text-[15px]">
            <div className="border-b border-slate-200 pb-6">
              <p>
                By accessing or using <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong>{' '}
                or submitting a carrier onboarding request to{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> (&ldquo;we,&rdquo;
                &ldquo;our,&rdquo; or &ldquo;us&rdquo;), you agree to be bound by these Terms and
                Conditions. If you do not agree with these terms, please discontinue use of this website.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                1. Role as an Independent Dispatch Service Provider
              </h2>
              <p>
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> is an{' '}
                <span className="font-semibold text-[#081B32]">
                  independent freight dispatch service provider
                </span>{' '}
                supporting licensed owner-operators and trucking fleets across the United States. Our
                operational dispatch services cover:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Hotshot Dispatch</li>
                <li>Power Only Dispatch</li>
                <li>Box Truck Dispatch</li>
                <li>Dry Van Dispatch</li>
                <li>Reefer Dispatch</li>
                <li>Flatbed Dispatch</li>
              </ul>
              <p>
                Our administrative services include load board and broker sourcing, lane rate negotiation on
                your behalf, broker carrier packet preparation, check-call coordination, and assistance
                with detention, layover, or Truck Order Not Used (TONU) documentation.
              </p>
              <p className="font-medium text-[#081B32]">
                Important Clarification:{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> is NOT a
                U.S. government agency, NOT a licensed motor carrier, and NOT a licensed freight or property
                broker. We do not take possession of cargo, issue bills of lading as a carrier, or broker
                freight in our own name.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                2. Carrier Authority, Compliance &amp; No Forced Dispatch
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-[#081B32]">Own Operating Authority:</span> Carriers
                  engaging our dispatch services must maintain active, valid MC and USDOT operating
                  authority and active primary auto liability and motor truck cargo insurance meeting
                  applicable broker and shipper requirements.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">Document Accuracy:</span> By uploading
                  required documents (W-9 Tax Form, MC Authority Letter, Certificate of Insurance, and any
                  optional Notice of Assignment) and submitting carrier information, you certify that all
                  records are current, truthful, and submitted with authority on behalf of the carrier.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">Carrier Sign-Off &amp; No Forced Dispatch:</span>{' '}
                  Carriers retain full control over equipment, drivers, routing, Hours of Service (HOS)
                  compliance, and load acceptance. Every rate confirmation requires direct carrier approval
                  and signature before dispatch commitment.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                3. Pricing, Billing &amp; Written Dispatch Agreement
              </h2>
              <p>
                Service rates listed on our{' '}
                <a
                  href="/pricing"
                  onClick={(e) => handleLinkClick(e, 'pricing')}
                  className="font-semibold underline underline-offset-4"
                  style={{color: colors.professionalRed}}
                >
                  Pricing
                </a>{' '}
                page outline standard dispatch fee tiers (percentage of gross load revenue or flat weekly
                structures). Submitting an online registration form initiates onboarding review only and
                does not establish a binding dispatch contract until both parties execute a written Dispatch
                Service Agreement specifying exact fee rates, billing schedules, and termination terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                4. Service Limitations &amp; No Earnings Guarantees
              </h2>
              <p>
                Freight rates, spot market demand, deadhead ratios, fuel expenses, and broker credit
                availability vary continuously across regions and seasons. While we strive to negotiate
                competitive freight rates,{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> makes no
                guarantee regarding weekly gross revenue, rate per mile (RPM), continuous load availability,
                or broker payment performance. All load contracts and rate confirmations exist strictly
                between the motor carrier and the applicable freight broker or shipper.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                5. Acceptable Website Use &amp; Carrier Lookup Tool
              </h2>
              <p>
                You agree to use <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong>{' '}
                solely for lawful business purposes and not to:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Submit false MC/USDOT numbers, forged compliance documents, or fraudulent contact
                  information.
                </li>
                <li>
                  Attempt unauthorized access to administrative consoles, private compliance storage, or
                  rate-limited API endpoints through automated scraping or credential attacks.
                </li>
                <li>
                  Interfere with the operation, availability, or security of our website or third-party
                  integrations.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                6. Intellectual Property &amp; Third-Party Links
              </h2>
              <p>
                All brand marks, logos, written content, layouts, and custom graphics on{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> belong to{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> or its
                licensors and may not be copied or redistributed without permission. Our website may
                reference or link to external platforms (including WhatsApp, public carrier lookup sources,
                social platforms, or third-party advertisements). We are not responsible for the content,
                availability, or practices of external websites.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                7. Disclaimer of Warranties &amp; Limitation of Liability
              </h2>
              <p>
                This website and its online tools are provided on an &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; basis without warranties of any kind, whether express or implied. To the
                fullest extent permitted by applicable law,{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> shall not
                be liable for indirect, incidental, special, consequential, or punitive damages—including
                lost profits, cargo claims, detention delays, broker non-payment, or temporary
                lookup/website interruptions—arising out of or related to use of this website or dispatch
                coordination services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                8. Indemnification, Changes &amp; Contact Information
              </h2>
              <p>
                You agree to indemnify and hold harmless{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> from
                claims, losses, or liabilities arising from inaccurate carrier information, lapsed insurance
                or operating authority, DOT/FMCSA safety violations, or misuse of this website. We reserve
                the right to update these Terms and Conditions at any time by posting revised terms on this
                page.
              </p>
              <p>
                Questions regarding these Terms and Conditions may be directed to{' '}
                <span className="font-medium text-[#081B32]">{activeContent.email}</span>,{' '}
                <span className="font-mono tabular-nums">{activeContent.phone}</span>, or through our{' '}
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

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileCheck2 className="h-4 w-4 text-[#081B32]" aria-hidden="true" />
                <span>Also review our Privacy Policy and Service Disclaimer.</span>
              </div>
              <a
                href="/disclaimer"
                onClick={(e) => handleLinkClick(e, 'disclaimer')}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#081B32] transition-colors hover:bg-slate-50"
              >
                <span>Read Legal Disclaimer</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
