import React from 'react';
import {useCms} from '../context/CmsContext.tsx';

interface TrdLogoProps {
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
  useWelcomeLogo?: boolean;
}

export const TrdLogo: React.FC<TrdLogoProps> = ({
  variant = 'dark',
  showWordmark = true,
  size = 'md',
  useWelcomeLogo = false,
}) => {
  const {activeContent} = useCms();
  const logoSrc = useWelcomeLogo ? activeContent.welcomeLogoUrl : activeContent.logoUrl;

  const heightClass =
    size === 'sm' ? 'h-10' : size === 'lg' ? 'h-20 sm:h-24' : 'h-12';

  if (variant === 'light') {
    return (
      <span className="inline-flex items-center gap-3 shrink-0">
        <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 shadow-md shrink-0">
          <img
            src={logoSrc}
            alt="Titan Route Dispatch (TRD) LLC Logo"
            className={`${heightClass} w-auto object-contain select-none`}
          />
        </span>
        {showWordmark && (
          <strong className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white leading-tight">
            {activeContent.companyName}
          </strong>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5 sm:gap-3 shrink-0">
      <img
        src={logoSrc}
        alt="Titan Route Dispatch (TRD) LLC Logo"
        className={`${heightClass} w-auto object-contain select-none shrink-0`}
      />
      {showWordmark && (
        <strong
          className="font-display text-xs sm:text-sm lg:text-base font-extrabold tracking-tight leading-tight"
          style={{color: activeContent.colors.deepNavy}}
        >
          {activeContent.companyName}
        </strong>
      )}
    </span>
  );
};
