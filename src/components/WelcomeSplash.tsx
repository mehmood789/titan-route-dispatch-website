import React, {useEffect, useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {useCms} from '../context/CmsContext.tsx';
import {AmericanTruckSvg} from './AmericanTruckSvg.tsx';

interface WelcomeSplashProps {
  visible: boolean;
  onComplete: () => void;
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({visible, onComplete}) => {
  const {activeContent, services} = useCms();
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setExiting(false);
      return;
    }

    const fadeTimer = window.setTimeout(() => {
      setExiting(true);
    }, 3100);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, 3650);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [visible, onComplete]);

  if (!visible) {
    return null;
  }

  const handleSkip = () => {
    setExiting(true);
    window.setTimeout(onComplete, 260);
  };

  const {colors} = activeContent;
  const equipmentLabels =
    services.length > 0
      ? services.map((s) => s.equipment)
      : ['Hotshot', 'Power Only', 'Box Truck', 'Dry Van', 'Reefer', 'Flatbed'];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between text-white transition-opacity duration-500 ${
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{backgroundColor: colors.darkBackground}}
      role="dialog"
      aria-modal="true"
      aria-label={`Welcome to ${activeContent.companyName}`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span
          className="font-mono text-xs font-medium tracking-wider"
          style={{color: colors.silverGrey}}
        >
          {activeContent.domain}
        </span>
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0 cursor-pointer"
          style={{backgroundColor: colors.professionalRed}}
        >
          <span>Skip Intro</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Center Actual TRD Logo + Moving Truck & Red Light Trails */}
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 text-center">
        <div className="mb-5 rounded-2xl bg-white px-6 py-3.5 shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
          <img
            src={activeContent.welcomeLogoUrl || activeContent.logoUrl}
            alt={`${activeContent.companyName} Official Logo`}
            className="h-24 w-auto object-contain sm:h-28"
          />
        </div>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
          {activeContent.welcomeHeadline}
        </h1>

        <p
          className="mt-2 font-display text-sm font-bold tracking-[0.16em] sm:text-base"
          style={{color: colors.professionalRed}}
        >
          {activeContent.welcomeSlogan}
        </p>

        {/* Moving Semi-Truck with Red Illuminated Light Trails */}
        <div className="relative mt-6 w-full overflow-hidden pt-1">
          <div className="animate-truck-drive mx-auto flex justify-center">
            <AmericanTruckSvg className="w-full max-w-[620px] h-auto drop-shadow-[0_14px_30px_rgba(213,43,53,0.22)]" />
          </div>

          <div
            className="relative -mt-3 h-10 w-full overflow-hidden rounded-sm border-t"
            style={{
              backgroundColor: colors.deepNavy,
              borderColor: colors.professionalRed,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-0.5 opacity-80"
              style={{
                background: `linear-gradient(to right, transparent, ${colors.professionalRed}, transparent)`,
              }}
            />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 w-[200%] flex items-center animate-road-scroll">
              {Array.from({length: 24}).map((_, idx) => (
                <span
                  key={idx}
                  className="mx-5 inline-block h-1 w-12 shrink-0 rounded-full"
                  style={{backgroundColor: colors.professionalRed}}
                />
              ))}
            </div>
            <div
              className="absolute inset-x-0 bottom-1 h-px opacity-35"
              style={{backgroundColor: colors.silverGrey}}
            />
          </div>
        </div>
      </div>

      {/* Bottom Equipment Bar */}
      <div
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-6 py-5 text-xs"
        style={{color: colors.silverGrey}}
      >
        {equipmentLabels.map((label, idx) => (
          <React.Fragment key={label}>
            {idx > 0 && <span aria-hidden="true">·</span>}
            <span>{label}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
