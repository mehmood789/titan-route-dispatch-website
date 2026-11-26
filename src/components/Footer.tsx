import React from 'react';
import {MessageCircle, RotateCcw} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';
import {TrdLogo} from './TrdLogo.tsx';
import {BoldBrandText} from './BoldBrandText.tsx';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
  onReplayIntro: () => void;
}

export const Footer: React.FC<FooterProps> = ({onNavigate, onReplayIntro}) => {
  const {activeContent} = useCms();
  const {colors, socialLinks} = activeContent;

  const whatsappClean = activeContent.whatsappNumber.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(
    `Hello ${activeContent.companyName}, I would like information about carrier dispatch.`
  )}`;

  const socialItems = [
    {label: 'Facebook', url: socialLinks.facebook},
    {label: 'Instagram', url: socialLinks.instagram},
    {label: 'LinkedIn', url: socialLinks.linkedin},
    {label: 'X', url: socialLinks.x},
  ].filter((item) => item.url && item.url.trim().length > 0);

  const handleRouteLink = (e: React.MouseEvent<HTMLAnchorElement>, page: PageRoute) => {
    e.preventDefault();
    onNavigate(page);
  };

  return (
    <footer
      className="border-t border-white/10"
      style={{backgroundColor: colors.darkBackground, color: colors.silverGrey}}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <TrdLogo variant="light" size="sm" />
            <p
              className="mt-4 text-xs font-bold tracking-[0.14em]"
              style={{color: colors.professionalRed}}
            >
              {activeContent.slogan}
            </p>
            <p
              className="mt-2.5 max-w-md text-sm leading-relaxed"
              style={{color: colors.silverGrey}}
            >
              <BoldBrandText text={activeContent.footerText} strongClassName="font-bold text-white" />
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <strong className="font-bold text-white">{activeContent.companyName}</strong>
              <span aria-hidden="true">·</span>
              <span>{activeContent.email}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{activeContent.phone}</span>
            </div>

            {socialItems.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                {socialItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-white underline-offset-4 hover:underline transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <h3 className="font-display text-sm font-semibold text-white">Company</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href="/"
                  onClick={(e) => handleRouteLink(e, 'home')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/about-us"
                  onClick={(e) => handleRouteLink(e, 'about-us')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  onClick={(e) => handleRouteLink(e, 'services')}
                  className="hover:text-white transition-colors"
                >
                  Dispatch Services
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => handleRouteLink(e, 'pricing')}
                  className="hover:text-white transition-colors"
                >
                  Pricing Plans
                </a>
              </li>
              <li>
                <a
                  href="/testimonials"
                  onClick={(e) => handleRouteLink(e, 'testimonials')}
                  className="hover:text-white transition-colors"
                >
                  Carrier Reviews
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-display text-sm font-semibold text-white">Carrier Desk</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href="/register"
                  onClick={(e) => handleRouteLink(e, 'register')}
                  className="font-semibold hover:opacity-85 transition-opacity"
                  style={{color: colors.professionalRed}}
                >
                  Register Your Truck
                </a>
              </li>
              <li>
                <a
                  href="/contact-us"
                  onClick={(e) => handleRouteLink(e, 'contact-us')}
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-white hover:opacity-85 transition-opacity"
                >
                  <MessageCircle
                    className="h-3.5 w-3.5"
                    style={{color: colors.professionalRed}}
                    aria-hidden="true"
                  />
                  <span>WhatsApp Dispatch</span>
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onReplayIntro}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Replay Welcome Intro</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-display text-sm font-semibold text-white">Legal &amp; Compliance</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <a
                  href="/privacy-policy"
                  onClick={(e) => handleRouteLink(e, 'privacy-policy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms-and-conditions"
                  onClick={(e) => handleRouteLink(e, 'terms-and-conditions')}
                  className="hover:text-white transition-colors"
                >
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  onClick={(e) => handleRouteLink(e, 'disclaimer')}
                  className="hover:text-white transition-colors"
                >
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} <strong className="font-bold text-white">{activeContent.companyName}</strong>. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{activeContent.address}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
