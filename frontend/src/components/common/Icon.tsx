import React from 'react';

interface IconProps {
  name: string;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

export function Icon({
  name,
  filled = false,
  className = '',
  style,
  'aria-hidden': ariaHidden = true,
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined select-none shrink-0 ${className}`}
      style={{
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined,
        ...style,
      }}
      aria-hidden={ariaHidden}
    >
      {name}
    </span>
  );
}
