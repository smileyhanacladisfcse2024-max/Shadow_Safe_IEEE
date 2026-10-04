import { Icon } from './Icon';

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  message = 'Unable to connect to ShadowSafe backend server.',
  onRetry,
  className = '',
}: ErrorBannerProps) {
  return (
    <div
      className={`bg-error-container/90 text-on-error-container p-space-sm rounded-xl shadow-lg flex items-center justify-between gap-space-xs ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-space-xs min-w-0">
        <Icon name="cloud_off" className="text-error text-[20px] shrink-0" />
        <span className="font-body-sm text-body-sm truncate">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-space-sm py-1 rounded-lg bg-surface-container-lowest text-on-surface font-label-sm text-[10px] uppercase font-bold shrink-0 active:scale-95 transition-transform"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function BackendUnreachableBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="w-full bg-error-container text-on-error-container px-margin py-1.5 flex items-center justify-between text-xs z-50 shadow-md">
      <div className="flex items-center gap-1.5">
        <Icon name="wifi_off" className="text-[16px] text-error" />
        <span className="font-label-sm font-semibold uppercase tracking-wider">
          Backend Unreachable (Port 8000)
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="underline font-bold hover:text-white uppercase tracking-wider"
        >
          Retry
        </button>
      )}
    </div>
  );
}
