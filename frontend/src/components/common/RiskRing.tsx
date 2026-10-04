interface RiskRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showBadge?: boolean;
  band?: string;
  badge?: string;
}

export function getRiskColor(score: number): {
  stroke: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  label: string;
} {
  if (score < 25) {
    return {
      stroke: '#4fdbc8',
      textColor: 'text-secondary',
      badgeBg: 'bg-secondary/15',
      badgeText: 'text-secondary',
      label: 'Safe Nominal',
    };
  }
  if (score < 50) {
    return {
      stroke: '#ffb95f',
      textColor: 'text-tertiary',
      badgeBg: 'bg-tertiary/15',
      badgeText: 'text-tertiary',
      label: 'Moderate Concern',
    };
  }
  if (score < 75) {
    return {
      stroke: '#ffb95f',
      textColor: 'text-tertiary',
      badgeBg: 'bg-tertiary-container',
      badgeText: 'text-on-tertiary-container',
      label: 'Elevated Risk',
    };
  }
  return {
    stroke: '#ffb4ab',
    textColor: 'text-error',
    badgeBg: 'bg-error-container',
    badgeText: 'text-on-error-container',
    label: 'Critical Alert',
  };
}

export function RiskRing({
  score,
  size = 64,
  strokeWidth = 5.5,
  showBadge = false,
  badge: customBadge,
}: RiskRingProps) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius; // ~163.36
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  const info = getRiskColor(clampedScore);
  const badgeLabel = customBadge || info.label;

  return (
    <div className="flex items-center gap-space-xs">
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#313540"
            strokeWidth={strokeWidth - 0.5}
          />
          <circle
            className="transition-all duration-700 ease-out"
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={info.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-headline-sm text-headline-sm leading-none font-bold ${info.textColor}`}>
            {clampedScore}
          </span>
          <span className="font-label-sm text-[9px] text-on-surface-variant">/100</span>
        </div>
      </div>
      {showBadge && (
        <span
          className={`px-space-xs py-0.5 rounded-full ${info.badgeBg} ${info.badgeText} font-label-sm text-[10px] uppercase font-bold tracking-wider`}
        >
          {badgeLabel}
        </span>
      )}
    </div>
  );
}
