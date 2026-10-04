import { useState, useEffect, useRef, useCallback } from 'react';
import {
  useGuardiansQuery,
  useSosStatusQuery,
  useArmSosMutation,
  useCancelSosMutation,
  useResolveSosMutation,
  useSilentEscortMutation,
  useAddGuardianMutation,
  useDeleteGuardianMutation,
  useConfirmCheckinMutation,
  useShareLiveRouteMutation,
  useHavenActionMutation,
} from '../api/hooks';
import { CHECKIN_EVENT_NAME } from '../api/stream';
import { Icon } from '../components/common/Icon';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useToast } from '../components/common/Toast';
import type { Guardian, LiveRouteShareResult } from '../api/types';

export function GuardiansPage() {
  const { showToast } = useToast();

  const { data: guardiansData, isLoading, isError, refetch } = useGuardiansQuery();
  const { data: sosStatus } = useSosStatusQuery();

  const armSos = useArmSosMutation();
  const cancelSos = useCancelSosMutation();
  const resolveSos = useResolveSosMutation();
  const silentEscort = useSilentEscortMutation();
  const addGuardian = useAddGuardianMutation();
  const deleteGuardian = useDeleteGuardianMutation();
  const confirmCheckin = useConfirmCheckinMutation();
  const shareLiveRoute = useShareLiveRouteMutation();
  const havenAction = useHavenActionMutation();

  // State
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianRelation, setNewGuardianRelation] = useState('Friend');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [shareResult, setShareResult] = useState<LiveRouteShareResult | null>(null);
  const [showCheckinPrompt, setShowCheckinPrompt] = useState(false);

  // Slide-to-SOS Slider state
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const sliderThumbRef = useRef<HTMLDivElement>(null);
  const sliderFillRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  useEffect(() => {
    document.title = 'Emergency & SOS — ShadowSafe 2.0';
  }, []);

  // Listen for silent check-in SSE event
  useEffect(() => {
    const handleCheckin = () => {
      setShowCheckinPrompt(true);
    };
    window.addEventListener(CHECKIN_EVENT_NAME, handleCheckin);
    return () => window.removeEventListener(CHECKIN_EVENT_NAME, handleCheckin);
  }, []);

  // Countdown timer calculation synchronized with server deadline_at
  useEffect(() => {
    if (sosStatus?.state !== 'armed' || !sosStatus?.deadline_at) {
      setCountdownRemaining(null);
      return;
    }

    const calculateRemaining = () => {
      const deadline = new Date(sosStatus.deadline_at!).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.ceil((deadline - now) / 1000));
      setCountdownRemaining(diffSec);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 250);
    return () => clearInterval(interval);
  }, [sosStatus?.state, sosStatus?.deadline_at]);

  // Handle slide completion
  const triggerArmSos = useCallback(async () => {
    if (armSos.isPending) return;
    try {
      await armSos.mutateAsync();
      showToast({ message: 'SOS Armed! 5s countdown initiated', variant: 'error' });
    } catch {
      showToast({ message: 'Failed to arm emergency SOS', variant: 'error' });
    }
  }, [armSos, showToast]);

  const resetSliderVisuals = useCallback(() => {
    currentXRef.current = 0;
    if (sliderThumbRef.current) {
      sliderThumbRef.current.style.transform = 'translateX(0px)';
      sliderThumbRef.current.style.transition = 'transform 0.25s ease-out';
    }
    if (sliderFillRef.current) {
      sliderFillRef.current.style.width = '48px';
      sliderFillRef.current.style.transition = 'width 0.25s ease-out';
    }
  }, []);

  // Slider Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (sosStatus?.state === 'armed' || sosStatus?.state === 'dispatched') return;
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startXRef.current = e.clientX - currentXRef.current;

    if (sliderThumbRef.current) sliderThumbRef.current.style.transition = 'none';
    if (sliderFillRef.current) sliderFillRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !sliderTrackRef.current || !sliderThumbRef.current) return;
    const trackWidth = sliderTrackRef.current.clientWidth;
    const thumbWidth = sliderThumbRef.current.clientWidth;
    const maxDist = trackWidth - thumbWidth - 12;

    let nextX = e.clientX - startXRef.current;
    if (nextX < 0) nextX = 0;
    if (nextX > maxDist) nextX = maxDist;

    currentXRef.current = nextX;
    sliderThumbRef.current.style.transform = `translateX(${nextX}px)`;
    if (sliderFillRef.current) {
      sliderFillRef.current.style.width = `${nextX + thumbWidth}px`;
    }

    // 92% threshold
    if (nextX >= maxDist * 0.92) {
      isDraggingRef.current = false;
      triggerArmSos();
      resetSliderVisuals();
    }
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    resetSliderVisuals();
  };

  const handleCancelSos = async () => {
    try {
      await cancelSos.mutateAsync();
      showToast({ message: 'Emergency dispatch cancelled', variant: 'tertiary' });
      resetSliderVisuals();
    } catch {
      showToast({ message: 'Failed to cancel SOS', variant: 'error' });
    }
  };

  const handleResolveSos = async () => {
    try {
      await resolveSos.mutateAsync();
      showToast({ message: 'SOS resolved — Standing down', variant: 'tertiary' });
      resetSliderVisuals();
    } catch {
      showToast({ message: 'Failed to resolve SOS', variant: 'error' });
    }
  };

  const handleToggleSilentEscort = async () => {
    if (!guardiansData || silentEscort.isPending) return;
    const nextState = !guardiansData.silent_escort.enabled;
    try {
      await silentEscort.mutateAsync(nextState);
      showToast({
        message: nextState ? 'Silent Escort Mode enabled' : 'Silent Escort Mode disabled',
        variant: 'tertiary',
      });
    } catch {
      showToast({ message: 'Failed to update silent escort', variant: 'error' });
    }
  };

  const handleConfirmCheckin = async () => {
    try {
      await confirmCheckin.mutateAsync();
      setShowCheckinPrompt(false);
      showToast({ message: 'Safe check-in confirmed', variant: 'tertiary' });
    } catch {
      showToast({ message: 'Failed to confirm check-in', variant: 'error' });
    }
  };

  const handleAddGuardianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardianName.trim() || !newGuardianPhone.trim()) {
      setAddError('Name and phone number are required');
      return;
    }
    setAddError(null);
    try {
      await addGuardian.mutateAsync({
        name: newGuardianName.trim(),
        relation: newGuardianRelation,
        phone: newGuardianPhone.trim(),
      });
      showToast({ message: `Added ${newGuardianName} to guardian circle`, variant: 'tertiary' });
      setShowAddModal(false);
      setNewGuardianName('');
      setNewGuardianPhone('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add guardian';
      setAddError(msg);
    }
  };

  const handleDeleteGuardian = async (guardian: Guardian) => {
    if (guardian.kind === 'official') return;
    try {
      await deleteGuardian.mutateAsync(guardian.id);
      showToast({ message: `Removed ${guardian.name}`, variant: 'tertiary' });
    } catch {
      showToast({ message: 'Failed to remove guardian', variant: 'error' });
    }
  };

  const handleShareLiveRoute = async () => {
    if (shareLiveRoute.isPending) return;
    try {
      const res = await shareLiveRoute.mutateAsync();
      setShareResult(res);

      // Copy passcode to clipboard
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(res.passcode);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = res.passcode;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        showToast({
          message: `Passcode #${res.passcode} copied to clipboard`,
          variant: 'primary',
          icon: 'content_copy',
        });
      } catch {
        showToast({ message: `Passcode: #${res.passcode}`, variant: 'primary' });
      }
    } catch {
      showToast({ message: 'Failed to create share link', variant: 'error' });
    }
  };

  const handleHavenWalk = async (havenId: string) => {
    try {
      const res = await havenAction.mutateAsync({ havenId, action: 'navigate' });
      showToast({ message: res.message, icon: 'directions_walk', variant: 'primary' });
    } catch {
      showToast({ message: 'Failed to start navigation to haven', variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-gutter pt-space-xs gap-space-md">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !guardiansData) {
    return (
      <div className="px-gutter pt-space-md">
        <ErrorBanner
          message="Failed to load emergency and guardian data."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { protection, guardians, immediate_haven, emergency_lines, active_count } = guardiansData;
  const isArmed = sosStatus?.state === 'armed';
  const isDispatched = sosStatus?.state === 'dispatched';

  return (
    <div className="flex flex-col w-full relative select-none">
      <div className="flex flex-col w-full px-gutter pb-safe space-y-space-md">
        {/* Status Chip & Reassurance Header */}
        <div className="flex items-center justify-between bg-surface-container-high/60 backdrop-blur-md px-space-md py-space-sm rounded-lg shadow-sm">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary" />
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-primary tracking-wider uppercase truncate">
                {protection.title}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {protection.subtitle}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-lowest/80 px-2.5 py-1 rounded-full shrink-0">
            <Icon name="verified" className="text-tertiary text-[14px]" />
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">Protected</span>
          </div>
        </div>

        {/* Primary Emergency Escalation Module */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl p-space-md shadow-xl gap-space-md relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-error-container/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <div className="w-8 h-8 rounded-full bg-error-container/30 flex items-center justify-center text-error">
                <Icon name="warning" className="text-[18px]" />
              </div>
              <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Critical Escalation
              </span>
            </div>
            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
              5s Grace Window
            </span>
          </div>

          {/* Countdown Modal / Banner (When Armed) */}
          {isArmed && (
            <div
              id="sos-countdown-banner"
              className="flex flex-col items-center justify-center bg-error-container/95 text-on-error-container p-space-md rounded-xl transition-all duration-300 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon name="sos" className="text-error animate-pulse text-[24px]" />
                <span className="font-headline-md text-headline-md font-bold uppercase tracking-wider">
                  Dispatch Triggered
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-center mb-3 text-on-error-container/90">
                Broadcasting live coordinates &amp; audio buffer to circle in:
              </p>
              <div className="flex items-center justify-center gap-space-md w-full">
                <div
                  id="countdown-timer"
                  className="w-12 h-12 rounded-full bg-error text-surface-container-lowest flex items-center justify-center font-headline-xl-mobile text-headline-xl-mobile font-bold shadow-lg"
                >
                  {countdownRemaining ?? 5}
                </div>
                <button
                  type="button"
                  id="cancel-sos-btn"
                  onClick={handleCancelSos}
                  disabled={cancelSos.isPending}
                  className="flex-1 py-3 px-4 rounded-xl bg-surface-container-lowest text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
                >
                  <Icon name="close" className="text-error text-[18px]" />
                  <span>CANCEL DISPATCH</span>
                </button>
              </div>
            </div>
          )}

          {/* Dispatched Broadcast Card */}
          {isDispatched && (
            <div className="flex flex-col items-center justify-center bg-error text-surface-container-lowest p-space-md rounded-xl shadow-2xl space-y-3">
              <div className="flex items-center gap-2">
                <Icon name="e911_emergency" className="text-[28px] animate-bounce" />
                <span className="font-headline-md font-bold tracking-tight">SOS DISPATCH ACTIVE</span>
              </div>
              <p className="font-body-sm text-center text-surface-container-lowest/90">
                Emergency broadcast transmitted to 911 dispatch &amp; {active_count} emergency guardians. Live GPS coordinates and audio telemetry are actively streamed.
              </p>
              <button
                type="button"
                onClick={handleResolveSos}
                disabled={resolveSos.isPending}
                className="w-full py-3 rounded-xl bg-surface-container-lowest text-error font-headline-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <Icon name="check_circle" className="text-[20px]" />
                <span>STAND DOWN (RESOLVE SOS)</span>
              </button>
            </div>
          )}

          {/* Interactive Slide-to-Activate Track (Active when idle) */}
          {!isArmed && !isDispatched && (
            <div
              id="slider-wrapper"
              ref={sliderTrackRef}
              className="relative w-full h-16 bg-surface-container-lowest rounded-full p-1.5 flex items-center overflow-hidden shadow-inner select-none touch-none"
            >
              <div
                id="slider-fill"
                ref={sliderFillRef}
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-secondary-container/40 via-error-container to-error/80 w-16 rounded-full transition-all duration-75 pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="flex items-center gap-1.5 opacity-80">
                  <span className="font-label-lg text-label-lg uppercase tracking-wider text-on-surface font-bold">
                    Slide to SOS Dispatch
                  </span>
                  <Icon name="chevron_right" className="text-[16px] text-primary animate-pulse" />
                  <Icon name="chevron_right" className="text-[16px] text-primary animate-pulse -ml-2" />
                </div>
              </div>
              <div
                id="slider-thumb"
                ref={sliderThumbRef}
                tabIndex={0}
                role="button"
                aria-label="Slide to dispatch SOS"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    triggerArmSos();
                  }
                }}
                className="relative z-10 w-12 h-12 rounded-full bg-error text-surface-container-lowest flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing focus:ring-2 focus:ring-primary outline-none transform transition-transform"
              >
                <Icon name="emergency" className="text-[24px]" />
              </div>
            </div>
          )}

          {/* De-escalation & Silent Escort Option */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              id="silent-escort-toggle"
              onClick={handleToggleSilentEscort}
              disabled={silentEscort.isPending}
              className="flex-1 flex items-center justify-between gap-space-xs py-2.5 px-3 rounded-full bg-surface-container-high/80 active:bg-surface-container-highest transition-colors"
            >
              <div className="flex items-center gap-space-xs">
                <Icon
                  name={guardiansData.silent_escort.enabled ? 'notifications_active' : 'notifications_paused'}
                  className={`text-[18px] ${guardiansData.silent_escort.enabled ? 'text-tertiary' : 'text-primary'}`}
                />
                <div className="flex flex-col text-left">
                  <span className="font-label-lg text-label-lg text-on-surface font-medium leading-none">
                    Silent Escort Mode
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                    Discreet Check-in: Silently checks on you every {Math.round(guardiansData.silent_escort.interval_s / 60)} min
                  </span>
                </div>
              </div>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  guardiansData.silent_escort.enabled ? 'bg-tertiary animate-pulse' : 'bg-outline-variant'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Discreet Silent Check-in Sheet */}
        {showCheckinPrompt && (
          <div className="bg-surface-container-high rounded-2xl p-space-md border border-secondary/40 shadow-xl flex items-center justify-between gap-space-sm animate-in fade-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-space-xs min-w-0">
              <Icon name="health_and_safety" className="text-secondary text-[24px] shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-headline-sm text-label-lg font-bold text-on-surface">
                  Silent Check-In: Are you safe?
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Single-tap to confirm your status to guardians
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleConfirmCheckin}
              className="px-space-md py-2 rounded-full bg-secondary text-on-secondary font-label-md font-bold shrink-0 active:scale-95 shadow-md"
            >
              Confirm Safe
            </button>
          </div>
        )}

        {/* Trusted Guardian Circle */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl p-space-md gap-space-sm shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <Icon name="group" className="text-primary text-[20px]" />
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                Trusted Guardians
              </span>
            </div>
            <div className="flex items-center gap-1 bg-tertiary-container/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-label-sm text-label-sm text-tertiary font-medium">
                {active_count} Active
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {guardians.map((guardian: Guardian) => {
              const isOfficial = guardian.kind === 'official';

              return (
                <div
                  key={guardian.id}
                  className="flex items-center justify-between p-space-sm bg-surface-container rounded-xl"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden ${
                          isOfficial ? 'text-primary' : 'text-secondary'
                        }`}
                      >
                        <Icon name={isOfficial ? 'local_police' : 'person'} className="text-[22px]" />
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-surface-container ${
                          isOfficial ? 'bg-primary' : 'bg-tertiary'
                        }`}
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                          {guardian.name}
                        </span>
                        <span
                          className={`font-label-sm text-label-sm px-1.5 py-0.2 rounded uppercase ${
                            isOfficial
                              ? 'bg-primary-container/20 text-primary'
                              : 'bg-secondary-container/30 text-secondary'
                          }`}
                        >
                          {guardian.relation}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {guardian.battery_pct !== null ? `Battery ${guardian.battery_pct}% • ` : ''}
                        {guardian.status_text}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isOfficial ? (
                      <div className="flex items-center gap-1 text-primary" title="Official Priority Link">
                        <Icon name="shield" className="text-[18px]" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 text-tertiary">
                          <Icon name="check_circle" className="text-[18px]" />
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${guardian.name}`}
                          onClick={() => handleDeleteGuardian(guardian)}
                          className="text-on-surface-variant hover:text-error p-1 transition-colors"
                        >
                          <Icon name="delete" className="text-[16px]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-surface-container-high active:bg-surface-container-highest transition-colors min-w-0"
            >
              <Icon name="person_add" className="text-secondary text-[16px]" />
              <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate">
                + Add Guardian
              </span>
            </button>

            <button
              type="button"
              id="ephemeral-link-btn"
              onClick={handleShareLiveRoute}
              disabled={shareLiveRoute.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary-container/20 active:bg-primary-container/30 transition-colors min-w-0"
            >
              <Icon name="share_location" className="text-primary text-[16px]" />
              <span className="font-label-sm text-label-sm text-primary font-bold truncate">
                {shareLiveRoute.isPending ? 'Generating Link...' : 'Share Live Route'}
              </span>
            </button>
          </div>
        </div>

        {/* Verified Safe Havens & Instant Telephony */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl p-space-md gap-space-sm shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <Icon name="local_hospital" className="text-tertiary text-[20px]" />
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                Immediate Safe Havens
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary">Staffed &amp; Open 24/7</span>
          </div>

          {/* Nearest Haven Card */}
          {immediate_haven && (
            <div className="p-space-sm bg-surface-container rounded-xl flex flex-col gap-2">
              <div className="flex items-start justify-between gap-space-xs">
                <div className="flex flex-col min-w-0">
                  <span className="font-body-lg text-body-lg text-on-surface font-bold truncate">
                    {immediate_haven.name}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                    {immediate_haven.distance_m}m {immediate_haven.direction} ({immediate_haven.walk_min}-min walk) • Staffed Sanctuary
                  </span>
                </div>
                <span className="font-label-sm text-label-sm bg-tertiary-container/30 text-tertiary px-2 py-0.5 rounded-full font-bold shrink-0">
                  OPEN
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {immediate_haven.phone ? (
                  <a
                    href={`tel:${immediate_haven.phone}`}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-sm text-label-sm font-semibold active:bg-surface-container-highest transition-colors"
                  >
                    <Icon name="call" className="text-tertiary text-[16px]" />
                    <span>Call Hub</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold opacity-50"
                  >
                    <Icon name="call" className="text-[16px]" />
                    <span>Call Hub</span>
                  </button>
                )}

                <button
                  type="button"
                  id="beacon-trigger"
                  onClick={() => handleHavenWalk(immediate_haven.id)}
                  disabled={havenAction.isPending}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold active:opacity-90 transition-opacity"
                >
                  <Icon name="near_me" className="text-[16px]" />
                  <span>Walk Route</span>
                </button>
              </div>
            </div>
          )}

          {/* Emergency Telephone Lines */}
          <div className="flex flex-col gap-2 pt-1">
            {emergency_lines.map((line, lIdx) => (
              <a
                key={lIdx}
                href={`tel:${line.tel}`}
                className="flex items-center justify-between p-space-sm bg-surface-container rounded-xl active:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-space-sm min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      line.tag === 'DIRECT'
                        ? 'bg-error-container/30 text-error'
                        : 'bg-secondary-container/30 text-secondary'
                    }`}
                  >
                    <Icon name={line.tag === 'DIRECT' ? 'phone_in_talk' : 'local_police'} className="text-[20px]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-body-lg text-body-lg text-on-surface font-bold truncate">
                        {line.name}
                      </span>
                      <span
                        className={`font-label-sm text-label-sm font-mono ${
                          line.tag === 'DIRECT' ? 'text-error' : 'text-secondary'
                        }`}
                      >
                        {line.tag}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {line.tag === 'DIRECT'
                        ? 'Direct voice channel with priority dispatch'
                        : 'Station & Corridor Rapid Escort Unit'}
                    </span>
                  </div>
                </div>
                <Icon name="call" className="text-on-surface-variant text-[20px] shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Discreet & Private Protection */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl p-space-md gap-space-xs shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <Icon name="verified_user" className="text-primary text-[18px]" />
              <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                Discreet &amp; Private Protection
              </span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
              <span className="font-label-sm text-label-sm text-tertiary font-mono">PROTECTED</span>
            </div>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Your live location and trip details are only shared with your selected trusted contacts while trip protection is active or when an SOS alert is triggered. You can pause or cancel at any time.
          </p>
          <div className="flex items-center justify-between bg-surface-container-lowest p-space-sm rounded-xl mt-1">
            <div className="flex items-center gap-2">
              <Icon name="lock" className="text-tertiary text-[16px]" />
              <span className="font-label-sm text-label-sm text-on-surface">End-to-End Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Icon name="cancel" className="text-primary text-[14px]" />
              <span className="font-label-sm text-label-sm text-primary font-mono">Instant Cancel Option</span>
            </div>
          </div>
        </div>

        {/* Jury Safety Note */}
        <div className="text-center py-1">
          <span className="text-[11px] text-on-surface-variant/75 font-body-sm">
            Demo mode - no real emergency services are contacted
          </span>
        </div>
      </div>

      {/* Add Guardian Bottom Sheet / Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-4">
          <div className="w-full max-w-md bg-surface-container rounded-2xl p-space-lg shadow-2xl border border-outline-variant/30 space-y-space-md animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="person_add" className="text-secondary text-[22px]" />
                <h3 className="font-headline-sm text-on-surface font-bold">Add Trusted Guardian</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
                aria-label="Close"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            {addError && (
              <div className="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddGuardianSubmit} className="space-y-space-sm">
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">
                  Guardian Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Smith"
                  value={newGuardianName}
                  onChange={(e) => setNewGuardianName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary outline-none text-body-md"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">
                  Relationship
                </label>
                <select
                  value={newGuardianRelation}
                  onChange={(e) => setNewGuardianRelation(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface focus:border-primary outline-none text-body-md"
                >
                  <option value="Family">Family</option>
                  <option value="Friend">Friend</option>
                  <option value="Partner">Partner</option>
                  <option value="Colleague">Colleague</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-on-surface-variant uppercase tracking-wider text-[10px]">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 019-2834"
                  value={newGuardianPhone}
                  onChange={(e) => setNewGuardianPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary outline-none text-body-md"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl bg-surface-container-high text-on-surface font-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addGuardian.isPending}
                  className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-md active:scale-95 transition-transform"
                >
                  {addGuardian.isPending ? 'Saving...' : 'Add Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Live Route Result Sheet */}
      {shareResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-4">
          <div className="w-full max-w-md bg-surface-container rounded-2xl p-space-lg shadow-2xl border border-outline-variant/30 space-y-space-md animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="share_location" className="text-primary text-[22px]" />
                <h3 className="font-headline-sm text-on-surface font-bold">Live Route Sharing Active</h3>
              </div>
              <button
                type="button"
                onClick={() => setShareResult(null)}
                className="text-on-surface-variant hover:text-on-surface p-1"
                aria-label="Close"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <p className="font-body-sm text-on-surface-variant">
              Ephemeral encrypted link created. Valid until{' '}
              {new Date(shareResult.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
            </p>

            <div className="p-space-sm bg-surface-container-low rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant">Access Passcode:</span>
                <span className="font-headline-md font-mono text-secondary font-bold tracking-wider">
                  #{shareResult.passcode}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant">Encrypted URL:</span>
                <span className="font-label-sm text-primary font-mono truncate max-w-[200px]">
                  {window.location.origin}/share/{shareResult.token}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  const url = `${window.location.origin}/share/${shareResult.token}`;
                  if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                    showToast({ message: 'Live route link copied!', variant: 'primary' });
                  }
                }}
                className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-label-md font-bold flex items-center justify-center gap-1.5"
              >
                <Icon name="link" className="text-[18px]" />
                <span>Copy Link</span>
              </button>
              <button
                type="button"
                onClick={() => setShareResult(null)}
                className="flex-1 h-11 rounded-xl bg-surface-container-high text-on-surface font-label-md font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuardiansPage;
