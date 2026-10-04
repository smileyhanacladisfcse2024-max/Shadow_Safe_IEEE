import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = 'h-4 w-full', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-container-high/60 ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
