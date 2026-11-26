import React from 'react';

interface BoldBrandTextProps {
  text: string;
  strongClassName?: string;
}

const BRAND_SPLIT_REGEX = /(Titan Route Dispatch \(TRD\) LLC|(?<![\w-])TRD(?![\w-]))/g;

export const BoldBrandText: React.FC<BoldBrandTextProps> = ({
  text,
  strongClassName = 'font-bold',
}) => {
  if (!text) return null;
  const parts = text.split(BRAND_SPLIT_REGEX);

  return (
    <>
      {parts.map((part, index) =>
        part === 'Titan Route Dispatch (TRD) LLC' || part === 'TRD' ? (
          <strong key={index} className={strongClassName}>
            {part}
          </strong>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
};
