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
      <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
        <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-1.5 shadow-md">
          <img
            src={logoSrc}
            alt={`${activeContent.companyName} Logo`}
            className={`${heightClass} w-auto object-contain select-none`}
          />
        </span>
        {showWordmark && (
          <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            {activeContent.companyName}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap shrink-0">
      <img
        src={logoSrc}
        alt={`${activeContent.companyName} Logo`}
        className={`${heightClass} w-auto object-contain select-none`}
      />
      {showWordmark && (
        <span
          className="hidden sm:inline font-display text-base font-bold tracking-tight whitespace-nowrap"
          style={{color: activeContent.colors.deepNavy}}
        >
          {activeContent.companyName}
        </span>
      )}
    </span>
  );
};
