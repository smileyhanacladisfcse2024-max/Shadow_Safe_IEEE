import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/common/Icon';
import { Logo } from '../components/common/Logo';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-margin text-center gap-space-md select-none">
      <Logo size={48} className="h-12 w-auto object-contain text-primary" />
      <div className="flex flex-col gap-1 items-center">
        <span className="font-headline-xl text-headline-xl font-bold text-primary">404</span>
        <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
          Page Not Found
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">
          The corridor or safety telemetry resource you requested does not exist.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/journey')}
        className="px-space-lg py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold flex items-center gap-2 active:scale-95 transition-transform"
      >
        <Icon name="radar" className="text-[18px]" />
        <span>Return to Live Journey</span>
      </button>
    </div>
  );
}
