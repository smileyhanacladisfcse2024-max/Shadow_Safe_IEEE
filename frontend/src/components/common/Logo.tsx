interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = 'h-8 w-auto object-contain shrink-0', size = 32 }: LogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ShadowSafe Shield Logo"
    >
      <rect width="48" height="48" rx="12" fill="#0B0F19" />
      <path
        d="M24 8L12 13V23C12 31.5 17.5 38.8 24 41C30.5 38.8 36 31.5 36 23V13L24 8Z"
        fill="#131B2E"
        stroke="#06B6D4"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="22" r="4" fill="#06B6D4" />
      <path d="M24 26V32" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="34" r="1.5" fill="#14B8A6" />
    </svg>
  );
}
