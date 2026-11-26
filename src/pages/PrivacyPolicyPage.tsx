import React from 'react';
import {ArrowRight, ShieldCheck} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';

interface PrivacyPolicyPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({onNavigate}) => {
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
            <span style={{color: colors.professionalRed}}>Legal &amp; Privacy Disclosures</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Privacy Policy
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base" style={{color: colors.silverGrey}}>
            Effective Date: November 26, 2026 · Last Updated: November 26, 2026
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <article className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 text-sm leading-relaxed text-slate-700 sm:p-10 sm:text-[15px]">
            <div className="border-b border-slate-200 pb-6">
              <p>
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> (&ldquo;we,&rdquo;
                &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates this freight dispatch website and
                carrier onboarding platform. This Privacy Policy explains what information we collect from
                website visitors and motor carrier applicants, how that information is used, which
                third-party service and advertising partners we interact with, how uploaded compliance
                documents are handled, and what privacy choices you have.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                1. Information We Collect
              </h2>
              <p>
                We collect information that you voluntarily submit through our website forms, as well as
                limited technical request data needed to deliver the website and protect security.
              </p>
              <div className="space-y-3 pt-1">
                <div>
                  <h3 className="font-display text-base font-semibold text-[#081B32]">
                    A. Carrier Registration &amp; Onboarding Information
                  </h3>
                  <p className="mt-1">
                    When you submit a carrier application on our registration page, we collect:
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5">
                    <li>
                      <span className="font-medium text-[#081B32]">Identity &amp; Contact Details:</span>{' '}
                      Owner or primary contact name, email address, and telephone number.
                    </li>
                    <li>
                      <span className="font-medium text-[#081B32]">Company &amp; Authority Identifiers:</span>{' '}
                      Legal company name, DBA name (if applicable), Motor Carrier (MC / docket) number,
                      USDOT number, physical address, and mailing address.
                    </li>
                    <li>
                      <span className="font-medium text-[#081B32]">Fleet &amp; Operations Profile:</span>{' '}
                      Equipment type (such as Hotshot, Power Only, Box Truck, Dry Van, Reefer, Flatbed, or
                      Step Deck), truck count, operating regions, factoring company name, active insurance
                      confirmation, selected dispatch plan, and optional operational notes.
                    </li>
                    <li>
                      <span className="font-medium text-[#081B32]">Carrier Lookup Snapshot:</span> If you
                      use the MC or USDOT lookup tool prior to submitting, we store the resulting public
                      carrier record summary (including operating status, authority details, safety/insurance
                      summary, lookup source, and timestamp) with your application for verification review.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-[#081B32]">
                    B. Uploaded Carrier Compliance Documents
                  </h3>
                  <p className="mt-1">
                    To complete dispatch onboarding and prepare broker carrier packets, our registration form
                    accepts uploads of the following compliance documents (PDF, PNG, or JPG, up to 3 MB per
                    file):
                  </p>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5">
                    <li>
                      <span className="font-medium text-[#081B32]">W-9 Tax Form</span> (required)
                    </li>
                    <li>
                      <span className="font-medium text-[#081B32]">MC Authority Letter</span> (required)
                    </li>
                    <li>
                      <span className="font-medium text-[#081B32]">
                        Certificate of Insurance (COI)
                      </span>{' '}
                      (required)
                    </li>
                    <li>
                      <span className="font-medium text-[#081B32]">Notice of Assignment (NOA)</span>{' '}
                      (optional, for carriers working with a factoring company)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-[#081B32]">
                    C. Contact Inquiries &amp; Direct Communications
                  </h3>
                  <p className="mt-1">
                    When you submit our Contact Us form, we collect your name, email address, optional
                    telephone number, inquiry topic, and message content. If you choose to contact us by
                    phone, email, or WhatsApp, we receive the contact details and message information you
                    provide during that communication.
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-base font-semibold text-[#081B32]">
                    D. Technical &amp; Browser Data
                  </h3>
                  <p className="mt-1">
                    When you visit <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong>,
                    standard technical information—such as IP address, browser type, referring URL, device
                    characteristics, and request timestamps—may be processed automatically by our web
                    hosting and edge infrastructure to serve pages, cache public lookups, prevent abuse, and
                    enforce rate limits.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                2. How We Use Information
              </h2>
              <p>We use the information collected on this website for the following business purposes:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Evaluating carrier onboarding applications and verifying active MC/USDOT authority and
                  insurance status.
                </li>
                <li>
                  Providing freight dispatch services, sourcing loads, negotiating rates, and preparing
                  broker/shipper carrier setup packets.
                </li>
                <li>
                  Communicating with carrier owners and dispatch contacts regarding onboarding status, load
                  opportunities, rate confirmations, detention/TONU claims, and support requests.
                </li>
                <li>
                  Administering tax, billing, factoring coordination, compliance documentation, and internal
                  operational records.
                </li>
                <li>
                  Maintaining website functionality, authenticating authorized administrators, and protecting
                  against spam, unauthorized access, or service abuse.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                3. Third-Party Services Used by This Website
              </h2>
              <p>
                To operate our website and carrier onboarding workflow, we rely on the following actual
                third-party infrastructure and data service providers:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-[#081B32]">
                    Google Firebase (Cloud Firestore, Firebase Authentication, and Firebase Storage):
                  </span>{' '}
                  Used to store website content, contact inquiries, and carrier registration applications; to
                  authenticate authorized administrators; and to store uploaded carrier compliance
                  documents when Firebase Storage is enabled.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">
                    Cloudflare (Cloudflare Workers &amp; Cloudflare R2 Storage):
                  </span>{' '}
                  Used to host public website assets, route server-side API endpoints, enforce rate limits
                  and edge caching on public carrier lookups, and store uploaded media or private compliance
                  documents when configured.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">
                    O Trucking Public Data API (chat.otrucking.com):
                  </span>{' '}
                  When you click &ldquo;Lookup Carrier&rdquo; on our registration form, your entered MC or
                  USDOT identifier is transmitted server-side to O Trucking&apos;s public API to retrieve
                  publicly available carrier census, authority, safety, and insurance records attributed to
                  FMCSA public datasets.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">Google Fonts:</span> Used to load web
                  typography assets directly from Google&apos;s font servers.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">WhatsApp:</span> Optional external
                  click-to-chat links open WhatsApp only if you choose to initiate a conversation with our
                  dispatch desk.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                4. Cookies, Google AdSense &amp; Third-Party Advertising
              </h2>
              <p>
                Cookies and browser storage technologies may be used on{' '}
                <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> for
                essential functionality and, on public website pages, for advertising:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-[#081B32]">Essential Session Storage:</span> Firebase
                  Authentication uses browser local persistence strictly to maintain authenticated
                  sessions for authorized administrators accessing the private admin console.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">
                    Google AdSense &amp; Third-Party Ad Vendors:
                  </span>{' '}
                  When Google AdSense advertising is enabled on public pages of this website, third-party
                  vendors, including Google, use cookies (and similar identifiers) to serve advertisements
                  based on a user&apos;s prior visits to{' '}
                  <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong> and/or
                  other websites across the Internet.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">Personalized Advertising:</span> Google&apos;s
                  use of advertising cookies enables Google and its partners to serve personalized ads to
                  visitors based on browsing visits to this site and other sites. Advertising partners may
                  also measure ad performance and prevent fraud.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">No Access to Private Carrier Records:</span>{' '}
                  Third-party advertising vendors and ad networks do not receive access to your carrier
                  registration submissions, contact inquiries, or uploaded compliance files (W-9, MC
                  Authority Letter, COI, or NOA).
                </li>
              </ul>

              <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4 sm:p-5">
                <h3 className="font-display text-sm font-bold text-[#081B32]">
                  Advertising &amp; Cookie Opt-Out Choices
                </h3>
                <p className="mt-1.5 text-sm text-slate-600">
                  Visitors may opt out of personalized advertising by visiting Google Ads Settings at{' '}
                  <a
                    href="https://adssettings.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4 hover:opacity-80"
                    style={{color: colors.professionalRed}}
                  >
                    https://adssettings.google.com/
                  </a>
                  . You may also opt out of certain third-party vendors&apos; uses of cookies for
                  personalized advertising by visiting{' '}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4 hover:opacity-80"
                    style={{color: colors.deepNavy}}
                  >
                    www.aboutads.info/choices
                  </a>
                  , or by adjusting cookie preferences in your web browser settings.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                5. How Information May Be Shared
              </h2>
              <p>
                We do not sell your uploaded carrier compliance documents. However, information you provide
                may be shared with others in the following operational and legal circumstances:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-[#081B32]">
                    Freight Brokers, Shippers &amp; Factoring Companies:
                  </span>{' '}
                  For active or onboarding carriers, carrier details and compliance packets (such as W-9,
                  MC Authority Letter, COI, and NOA) are shared with freight brokers, shippers, and your
                  designated factoring partner strictly as required to set up carrier accounts, book loads,
                  and process freight settlements.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">Service &amp; Infrastructure Providers:</span>{' '}
                  Cloud database, storage, edge networking, and public carrier lookup providers referenced in
                  Section 3 process data on our behalf to operate the site.
                </li>
                <li>
                  <span className="font-medium text-[#081B32]">Legal &amp; Safety Obligations:</span> We may
                  disclose information if required by applicable law, subpoena, regulatory request, or to
                  protect the rights, safety, or property of{' '}
                  <strong className="font-bold text-[#081B32]">{activeContent.companyName}</strong>, our
                  carriers, or the public.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                6. Data Retention &amp; Security Practices
              </h2>
              <p>
                <span className="font-semibold text-[#081B32]">Retention:</span> We retain carrier
                registration records, compliance documents, and inquiry messages for as long as needed to
                review applications, administer dispatch services, maintain commercial and tax records, or
                comply with applicable legal requirements. You may contact us to request deletion of records
                that we are not legally required to retain.
              </p>
              <p>
                <span className="font-semibold text-[#081B32]">Security:</span> We use HTTPS encryption in
                transit, restricted administrator-only authentication and token verification for accessing
                carrier registrations and uploaded compliance files, and non-public storage controls so that
                private carrier records and documents are not publicly indexed or browsable. While we apply
                commercially reasonable safeguards appropriate for our operations, no internet transmission
                or electronic storage system can be guaranteed completely secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                7. Your Privacy Rights &amp; Contacting Us
              </h2>
              <p>
                Depending on your location and applicable law, you may have the right to request access to
                the personal or company information we hold about you, ask us to correct inaccurate details,
                or request deletion of your registration or inquiry records (subject to legal and contractual
                retention obligations).
              </p>
              <p>
                To submit a privacy request, update your carrier file, or ask questions about this Privacy
                Policy, please contact us using the official channels below or visit our{' '}
                <a
                  href="/contact-us"
                  onClick={(e) => handleLinkClick(e, 'contact-us')}
                  className="font-semibold underline underline-offset-4"
                  style={{color: colors.professionalRed}}
                >
                  Contact Us
                </a>{' '}
                page:
              </p>
              <div className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4 text-sm text-slate-700">
                <div className="font-bold text-[#081B32]">{activeContent.companyName}</div>
                <div className="mt-1">Email: {activeContent.email}</div>
                <div>Phone: {activeContent.phone}</div>
                <div>Address: {activeContent.address}</div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold" style={{color: colors.deepNavy}}>
                8. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time to reflect operational, technical, or
                regulatory updates. Any changes will be posted on this page with an updated effective date.
              </p>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-[#16A34A]" aria-hidden="true" />
                <span>Private carrier packets remain restricted to authorized dispatch staff.</span>
              </div>
              <a
                href="/contact-us"
                onClick={(e) => handleLinkClick(e, 'contact-us')}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{backgroundColor: colors.professionalRed}}
              >
                <span>Contact Privacy &amp; Operations</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
};
