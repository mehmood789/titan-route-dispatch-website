import React, {useEffect, useState} from 'react';
import {Truck} from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle = 'Titan Route Dispatch LLC',
}) => {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (errored || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#050F1C] via-[#081B32] to-[#122D4F] p-6 text-center text-white ${className}`}
      >
        <Truck className="mb-2 h-9 w-9 text-[#D52B35]" aria-hidden="true" />
        <span className="font-display text-sm font-semibold tracking-tight">{fallbackTitle}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
    />
  );
};
