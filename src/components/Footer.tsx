import React from 'react';
import {MessageCircle, RotateCcw} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';
import {TrdLogo} from './TrdLogo.tsx';

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

  return (
    <footer
      className="border-t border-white/10"
      style={{backgroundColor: colors.darkBackground, color: colors.silverGrey}}
    >
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
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
              {activeContent.footerText}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span>{activeContent.domain}</span>
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

          <div>
            <h3 className="font-display text-sm font-semibold text-white">Navigation</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('services')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Dispatch Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Pricing Plans
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('testimonials')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Carrier Reviews
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-white">Carrier Desk</h3>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="font-semibold hover:opacity-85 transition-opacity cursor-pointer"
                  style={{color: colors.professionalRed}}
                >
                  Register Your Truck
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Contact Dispatch
                </button>
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
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()} {activeContent.companyName} ({activeContent.domain}). All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span>{activeContent.address}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
