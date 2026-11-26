import React from 'react';

interface AmericanTruckSvgProps {
  className?: string;
}

const Wheel: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <g transform={`translate(${cx}, ${cy})`}>
    <circle r="15" fill="#050F1C" stroke="#AEBBC9" strokeWidth="1.5" />
    <g className="animate-wheel-spin">
      <circle r="9.5" fill="#E2E8F0" />
      <circle r="4.5" fill="#081B32" />
      <line x1="-9" y1="0" x2="9" y2="0" stroke="#64748B" strokeWidth="1.6" />
      <line x1="0" y1="-9" x2="0" y2="9" stroke="#64748B" strokeWidth="1.6" />
    </g>
    <circle r="2.2" fill="#D52B35" />
  </g>
);

export const AmericanTruckSvg: React.FC<AmericanTruckSvgProps> = ({
  className = 'w-full max-w-[660px] h-auto',
}) => {
  return (
    <svg
      viewBox="0 0 720 205"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="American Class-8 semi-truck with red illuminated light trails"
    >
      {/* Red Illuminated Light Trails streaming behind the truck */}
      <g className="animate-light-trail">
        <rect x="0" y="130" width="150" height="4" rx="2" fill="url(#redTrailPrimary)" />
        <rect x="18" y="114" width="132" height="2.5" rx="1.25" fill="url(#redTrailSecondary)" />
        <rect x="35" y="142" width="115" height="3" rx="1.5" fill="url(#redTrailPrimary)" />
        <rect x="6" y="42" width="144" height="2" rx="1" fill="url(#redTrailSecondary)" />
      </g>

      {/* Headlight beam */}
      <polygon
        points="664,125 720,104 720,162 664,142"
        fill="url(#headlightBeam)"
      />

      <g className="animate-cab-idle">
        {/* 53' American Dry Van / Reefer Trailer */}
        <rect
          x="148"
          y="28"
          width="322"
          height="114"
          rx="4"
          fill="#FFFFFF"
          stroke="#AEBBC9"
          strokeWidth="2"
        />
        <line x1="156" y1="36" x2="462" y2="36" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="156" y1="134" x2="462" y2="134" stroke="#E2E8F0" strokeWidth="1" />

        {/* Deep Navy & Red TRD Livery Stripe */}
        <rect x="148" y="96" width="322" height="14" fill="#081B32" />
        <rect x="148" y="110" width="322" height="6" fill="#D52B35" />

        {/* Rear Red Marker Tail Lamp Glow */}
        <rect x="144" y="126" width="5" height="12" rx="1.5" fill="#D52B35" />
        <rect x="144" y="34" width="5" height="8" rx="1.5" fill="#D52B35" />

        {/* Trailer Typography */}
        <text
          x="166"
          y="70"
          fill="#081B32"
          fontSize="16.5"
          fontWeight="800"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="0.5"
        >
          Titan Route Dispatch (TRD) LLC
        </text>
        <text
          x="166"
          y="88"
          fill="#D52B35"
          fontSize="10.5"
          fontWeight="700"
          fontFamily="Plus Jakarta Sans, sans-serif"
          letterSpacing="2"
        >
          48-STATE FREIGHT DISPATCH
        </text>

        {/* Trailer Undercarriage & Aero Skirt */}
        <polygon points="270,142 445,142 435,156 284,156" fill="#081B32" />
        <rect x="154" y="142" width="110" height="10" fill="#1E293B" />

        {/* Fifth Wheel / Coupling Frame */}
        <rect x="450" y="140" width="198" height="14" rx="2" fill="#050F1C" />

        {/* Chrome Vertical Exhaust Stack */}
        <rect x="503" y="34" width="9" height="96" rx="3" fill="#AEBBC9" stroke="#94A3B8" strokeWidth="1" />
        <path d="M503 34C503 28 498 24 494 24H511C511 29 512 34 512 34H503Z" fill="#94A3B8" />

        {/* American Long-Nose Sleeper Cab */}
        <path
          d="M512 48C512 42 517 38 523 38H572C582 38 590 46 594 60L598 76H512V48Z"
          fill="#081B32"
        />
        <path
          d="M512 76H598L618 92L660 97C666 98 670 103 670 110V143H512V76Z"
          fill="#0D2647"
        />
        {/* Red Racing Stripe on Cab & Hood */}
        <path d="M512 108H670V114H512V108Z" fill="#D52B35" />
        <rect x="512" y="103" width="58" height="3" fill="#FFFFFF" />

        {/* Cab Roof Marker Lights */}
        <rect x="562" y="42" width="7" height="3.5" rx="1.5" fill="#D52B35" />
        <rect x="573" y="42" width="7" height="3.5" rx="1.5" fill="#D52B35" />
        <rect x="584" y="45" width="7" height="3.5" rx="1.5" fill="#D52B35" />

        {/* Windshield & Side Window */}
        <polygon points="574,54 591,54 609,89 574,89" fill="#CBD5E1" opacity="0.9" />
        <rect x="544" y="56" width="24" height="30" rx="3" fill="#CBD5E1" opacity="0.82" />
        <rect x="523" y="60" width="13" height="20" rx="2" fill="#AEBBC9" opacity="0.65" />

        {/* Chrome Fuel Tank & Steps */}
        <rect x="538" y="132" width="60" height="22" rx="11" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="545" y="132" width="4" height="22" fill="#475569" />
        <rect x="587" y="132" width="4" height="22" fill="#475569" />

        {/* Chrome Front Grille & Bumper */}
        <rect x="659" y="99" width="12" height="33" rx="2" fill="#FFFFFF" stroke="#AEBBC9" strokeWidth="1.2" />
        <line x1="663" y1="103" x2="663" y2="128" stroke="#64748B" strokeWidth="1.2" />
        <line x1="667" y1="103" x2="667" y2="128" stroke="#64748B" strokeWidth="1.2" />
        <rect x="662" y="133" width="14" height="15" rx="2" fill="#F1F5F9" stroke="#AEBBC9" strokeWidth="1.2" />

        {/* Headlight */}
        <rect x="656" y="122" width="8" height="8" rx="1.5" fill="#FFFFFF" />

        {/* Side Mirror */}
        <rect x="586" y="68" width="6" height="18" rx="1.5" fill="#E2E8F0" />
        <line x1="586" y1="73" x2="578" y2="73" stroke="#AEBBC9" strokeWidth="2" />
      </g>

      {/* Trailer Tandem Wheels */}
      <Wheel cx={198} cy={158} />
      <Wheel cx={234} cy={158} />

      {/* Tractor Drive Tandem Wheels */}
      <Wheel cx={486} cy={158} />
      <Wheel cx={522} cy={158} />

      {/* Tractor Steer Wheel */}
      <Wheel cx={636} cy={158} />

      <defs>
        <linearGradient id="headlightBeam" x1="664" y1="133" x2="720" y2="133" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="redTrailPrimary" x1="150" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D52B35" stopOpacity="0.95" />
          <stop offset="1" stopColor="#D52B35" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="redTrailSecondary" x1="150" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D52B35" stopOpacity="0.65" />
          <stop offset="1" stopColor="#D52B35" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};
