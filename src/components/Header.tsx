import React, {useState} from 'react';
import {Eye, Menu, X} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import type {PageRoute} from '../types.ts';
import {TrdLogo} from './TrdLogo.tsx';

interface HeaderProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
}

export const Header: React.FC<HeaderProps> = ({currentPage, onNavigate}) => {
  const {activeContent, isAdmin, isPreviewMode, setPreviewMode} = useCms();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavItems = activeContent.navItems.filter((item) => item.visible);
  const {colors} = activeContent;

  const handleSelect = (page: PageRoute) => {
    setMobileMenuOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {isAdmin && isPreviewMode && (
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs text-white sm:px-6"
          style={{backgroundColor: colors.deepNavy}}
        >
          <div className="flex items-center gap-2 font-medium">
            <Eye className="h-3.5 w-3.5" style={{color: colors.professionalRed}} aria-hidden="true" />
            <span>Draft Preview Mode Active — Viewing unpublished CMS changes</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSelect('admin')}
              className="rounded px-2.5 py-0.5 font-semibold text-white underline cursor-pointer"
            >
              Back to Admin
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="rounded px-2.5 py-0.5 font-semibold text-white cursor-pointer"
              style={{backgroundColor: colors.professionalRed}}
            >
              Exit Preview
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-4 py-2.5 sm:px-6">
        {/* Left: Actual TRD Logo */}
        <button
          type="button"
          onClick={() => handleSelect('home')}
          className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
          aria-label={`${activeContent.companyName} Home`}
        >
          <TrdLogo variant="dark" size="sm" />
        </button>

        {/* Right: Clean Navigation + Red Contact & Registration Buttons */}
        <div className="flex items-center gap-6 shrink-0">
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
            {visibleNavItems.map((item) => {
              const active = currentPage === item.page;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.page)}
                  className={`relative py-1 text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'font-semibold' : 'font-medium text-slate-600 hover:text-slate-900'
                  }`}
                  style={active ? {color: colors.deepNavy} : undefined}
                >
                  {item.label}
                  {active && (
                    <span
                      className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full"
                      style={{backgroundColor: colors.professionalRed}}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleSelect('contact')}
              className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              style={
                currentPage === 'contact'
                  ? {
                      borderColor: colors.professionalRed,
                      backgroundColor: colors.professionalRed,
                      color: '#FFFFFF',
                    }
                  : {
                      borderColor: colors.professionalRed,
                      color: colors.professionalRed,
                    }
              }
            >
              Contact
            </button>
            <button
              type="button"
              onClick={() => handleSelect('register')}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
              style={{backgroundColor: colors.professionalRed}}
            >
              Register Carrier
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 md:hidden cursor-pointer"
            style={{color: colors.deepNavy}}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            <button
              type="button"
              onClick={() => handleSelect('home')}
              className={`flex min-h-[44px] items-center rounded-lg px-3 text-left text-sm font-medium ${
                currentPage === 'home' ? 'bg-slate-100 font-semibold' : 'text-slate-700'
              }`}
              style={currentPage === 'home' ? {color: colors.deepNavy} : undefined}
            >
              Home
            </button>
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.page)}
                className={`flex min-h-[44px] items-center rounded-lg px-3 text-left text-sm font-medium ${
                  currentPage === item.page ? 'bg-slate-100 font-semibold' : 'text-slate-700'
                }`}
                style={currentPage === item.page ? {color: colors.deepNavy} : undefined}
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelect('contact')}
                className="flex min-h-[44px] items-center justify-center rounded-lg border px-4 text-sm font-semibold"
                style={{borderColor: colors.professionalRed, color: colors.professionalRed}}
              >
                Contact
              </button>
              <button
                type="button"
                onClick={() => handleSelect('register')}
                className="flex min-h-[44px] items-center justify-center rounded-lg px-4 text-sm font-semibold text-white"
                style={{backgroundColor: colors.professionalRed}}
              >
                Register
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
