import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSharedRouteQuery } from '../api/hooks';
import { ApiError } from '../api/client';
import { Icon } from '../components/common/Icon';
import { RiskRing } from '../components/common/RiskRing';
import { Skeleton } from '../components/common/Skeleton';

export function SharePage() {
  const { token = '' } = useParams<{ token: string }>();
  const [passcode, setPasscode] = useState('');
  const [enteredPasscode, setEnteredPasscode] = useState('');

  useEffect(() => {
    document.title = 'Shared Live Route — ShadowSafe 2.0';
  }, []);

  const { data: sharedData, isLoading, isError, error, refetch } = useSharedRouteQuery(
    token,
    enteredPasscode,
    Boolean(token && enteredPasscode)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setEnteredPasscode(passcode.trim());
  };

  let errorMessage: string | null = null;
  if (isError && error instanceof ApiError) {
    if (error.status === 401) {
      errorMessage = 'Incorrect passcode. Please check with the commuter.';
    } else if (error.status === 404) {
      errorMessage = 'This shared route link was not found or has been revoked.';
    } else if (error.status === 410) {
      errorMessage = 'This temporary route share link has expired.';
    } else {
      errorMessage = error.message || 'Unable to access shared route.';
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-margin py-8">
      <div className="w-full max-w-md bg-surface-container rounded-2xl p-space-lg shadow-2xl border border-outline-variant/30 space-y-space-md">
        {/* Header */}
        <div className="flex items-center gap-space-sm border-b border-outline-variant/20 pb-space-sm">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon name="share_location" className="text-[22px]" />
          </div>
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Live Route Guardian View
            </h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Ephemeral Read-Only Access
            </span>
          </div>
        </div>

        {/* If no passcode entered yet, prompt for passcode */}
        {!enteredPasscode || (isError && error instanceof ApiError && error.status === 401) ? (
          <form onSubmit={handleSubmit} className="space-y-space-md">
            <p className="font-body-sm text-on-surface-variant">
              This live route is encrypted. Enter the 4-digit passcode shared by the commuter to unlock real-time location.
            </p>

            {errorMessage && (
              <div className="p-space-sm rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2">
                <Icon name="error" className="text-[16px] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-on-surface-variant uppercase text-[10px]">
                Access Passcode
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. 7492"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface font-mono text-center text-xl tracking-widest focus:border-primary outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-primary text-on-primary font-headline-sm font-bold shadow-md active:scale-95 transition-transform"
            >
              Unlock Route Telemetry
            </button>
          </form>
        ) : isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="space-y-4">
            <div className="p-space-sm rounded-xl bg-error-container text-on-error-container text-sm font-semibold flex items-center gap-2">
              <Icon name="error" className="text-[18px] shrink-0" />
              <span>{errorMessage || 'Failed to load live route'}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEnteredPasscode('');
                setPasscode('');
              }}
              className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md"
            >
              Try Again
            </button>
          </div>
        ) : sharedData ? (
          <div className="space-y-space-md">
            {/* Live Status Header */}
            <div className="flex items-center justify-between bg-surface-container-low p-space-sm rounded-xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-label-md text-secondary font-bold uppercase">
                  Active Transit Corridor
                </span>
              </div>
              <span className="font-label-sm text-on-surface-variant">
                Trip #{sharedData.trip_id}
              </span>
            </div>

            {/* Score Ring & Assessment */}
            <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-xl gap-3">
              <RiskRing
                score={sharedData.risk_score}
                band={sharedData.band}
                badge={sharedData.band.toUpperCase()}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-label-sm text-primary font-bold uppercase">
                  {sharedData.band}
                </span>
                <span className="font-body-sm text-on-surface font-semibold line-clamp-2">
                  Live encrypted telemetry stream active
                </span>
              </div>
            </div>

            {/* Position Telemetry */}
            <div className="bg-surface-container-lowest p-space-sm rounded-xl space-y-1 font-label-sm text-xs text-on-surface-variant">
              <div>Coordinates: X: {sharedData.position.x_m}m, Y: {sharedData.position.y_m}m</div>
              <div>Heading: {sharedData.heading}</div>
              <div>Last ping: {new Date(sharedData.timestamp).toLocaleTimeString()}</div>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              className="w-full py-2 rounded-xl bg-surface-container-high text-on-surface font-label-sm flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <Icon name="refresh" className="text-[16px]" />
              <span>Refresh Coordinates</span>
            </button>
          </div>
        ) : null}

        <div className="pt-2 text-center">
          <Link
            to="/journey"
            className="text-xs text-primary hover:underline font-label-sm"
          >
            ← Return to ShadowSafe Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SharePage;
