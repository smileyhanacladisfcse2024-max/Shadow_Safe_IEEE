import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useRiskQuery,
  useSimulateRerouteMutation,
  useNotifyCircleMutation,
} from '../api/hooks';
import { Icon } from '../components/common/Icon';
import { Segments } from '../components/common/Segments';
import { Skeleton } from '../components/common/Skeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useToast } from '../components/common/Toast';
import { relativeSecondsAgo } from '../utils/format';
import type { FactorCard } from '../api/types';

export function FactorsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: riskReport, isLoading, isError, refetch } = useRiskQuery();

  const simulateReroute = useSimulateRerouteMutation();
  const notifyCircle = useNotifyCircleMutation();

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    corridor: true,
    dwell: true,
    advisory: true,
    environment: true,
  });
  const [showWeightingSheet, setShowWeightingSheet] = useState(false);
  const [inlineToast, setInlineToast] = useState<{ message: string; isPrimary: boolean } | null>(null);
  const [relativeTime, setRelativeTime] = useState('12s ago');

  useEffect(() => {
    document.title = 'Safety Factor Breakdown — ShadowSafe 2.0';
  }, []);

  // Update relative time live every second
  useEffect(() => {
    if (!riskReport?.engine.evaluated_at) return;
    const update = () => {
      setRelativeTime(relativeSecondsAgo(riskReport.engine.evaluated_at));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [riskReport?.engine.evaluated_at]);

  if (isLoading) {
    return (
      <div className="flex flex-col w-full px-margin pt-space-xs gap-space-md">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !riskReport) {
    return (
      <div className="px-margin pt-space-md">
        <ErrorBanner
          message="Failed to load safety factor telemetry."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { engine, score, label, safe_threshold, disclaimer, weights, drivers, factors, nearest_haven } = riskReport;

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSimulateReroute = async () => {
    try {
      const res = await simulateReroute.mutateAsync();
      setInlineToast({ message: res.message, isPrimary: true });
      setTimeout(() => setInlineToast(null), 3500);
    } catch {
      showToast({ message: 'Simulation request failed', variant: 'error' });
    }
  };

  const handleShareAudit = async () => {
    try {
      const res = await notifyCircle.mutateAsync({ kind: 'audit_log' });
      setInlineToast({ message: res.message, isPrimary: false });
      setTimeout(() => setInlineToast(null), 3500);
    } catch {
      showToast({ message: 'Failed to dispatch audit log', variant: 'error' });
    }
  };

  // Radial gauge parameters
  // Radius = 66, circumference = 2 * PI * 66 ≈ 414.69
  const circumference = 414.7;
  const strokeDashoffset = Math.max(0, circumference - (score / 100) * circumference);

  const activeFactorsCount = drivers.filter((d) => d.points > 0).length;

  return (
    <div className="flex flex-col w-full relative select-none">
      <div className="flex flex-col w-full px-margin pb-safe space-y-space-lg">
        {/* Transparent Engine Telemetry Chip */}
        <div className="flex items-center justify-between bg-surface-container-low px-space-md py-space-sm rounded-xl">
          <div className="flex items-center gap-space-xs min-w-0">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse shrink-0" />
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {engine.label} • Evaluated {relativeTime}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Icon name="verified" className="text-primary text-[14px]" />
            <span className="font-label-sm text-label-sm text-primary">{engine.version}</span>
          </div>
        </div>

        {/* Hero Score Attribution Card (Bento Master) */}
        <div className="relative overflow-hidden bg-surface-container rounded-2xl p-space-lg shadow-xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-tertiary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-primary/5 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col items-center text-center">
            <div className="flex items-center justify-between w-full mb-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Explainable Risk Audit
              </span>
              <button
                type="button"
                onClick={() => setShowWeightingSheet(true)}
                className="inline-flex items-center gap-1 px-space-sm py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-sm text-label-sm font-semibold active:scale-95 transition-transform"
              >
                <Icon name="tune" className="text-[13px]" />
                Open Weighting
              </button>
            </div>

            {/* Composite Radial Gauge & Score */}
            <div className="relative w-44 h-44 my-space-xs flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                {/* Background track */}
                <circle
                  className="text-surface-container-highest"
                  cx="80"
                  cy="80"
                  fill="none"
                  r="66"
                  stroke="currentColor"
                  strokeWidth="12"
                />
                {/* Calibrated score segment */}
                <circle
                  className="text-tertiary transition-all duration-1000 ease-out"
                  cx="80"
                  cy="80"
                  fill="none"
                  r="66"
                  stroke="currentColor"
                  strokeDasharray="414.7"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="12"
                />
                {/* Baseline safe threshold reference marker */}
                <circle
                  className="text-secondary"
                  cx="80"
                  cy="80"
                  fill="none"
                  r="66"
                  stroke="currentColor"
                  strokeDasharray="4 410"
                  strokeDashoffset="331"
                  strokeWidth="12"
                />
              </svg>

              {/* Inner Metric Telemetry Core */}
              <div className="absolute flex flex-col items-center justify-center">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-headline-xl text-headline-xl text-tertiary font-bold tracking-tight">
                    {score}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">/100</span>
                </div>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant mt-0.5">
                  Concern Score
                </span>
                <span className="mt-1 px-space-xs py-0.2 rounded bg-surface-container-highest font-label-sm text-[9px] text-secondary font-medium">
                  Safe &lt; {safe_threshold}
                </span>
              </div>
            </div>

            {/* Qualitative Assessment Label */}
            <div className="mt-space-xs inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-full bg-tertiary/15 text-tertiary">
              <Icon name="warning" className="text-[18px]" />
              <span className="font-headline-sm text-label-lg font-bold">{label}</span>
            </div>

            {/* Humanized Context Disclaimer */}
            <p className="mt-space-sm font-body-sm text-body-sm text-on-surface-variant max-w-xs leading-relaxed">
              {disclaimer}
            </p>

            {/* Attribution Stack Bar */}
            <div className="w-full mt-space-md pt-space-md bg-surface-container-low/70 rounded-xl p-space-sm">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mb-1.5">
                <span>Attribution Drivers (+{score} pts)</span>
                <span className="text-tertiary">{activeFactorsCount} Active Factors</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-container-highest flex overflow-hidden">
                {drivers.map((driver, idx) => {
                  const colors = ['bg-tertiary', 'bg-tertiary-container', 'bg-primary', 'bg-secondary'];
                  return (
                    <div
                      key={driver.id}
                      className={`h-full ${colors[idx % colors.length]}`}
                      style={{ width: `${driver.share_pct}%` }}
                      title={`${driver.label} (+${driver.points})`}
                    />
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-1 mt-2 text-center font-label-sm text-[10px] text-on-surface-variant">
                {drivers.map((driver) => (
                  <span key={driver.id} className="truncate">
                    {driver.label} +{driver.points}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-space-xs">
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
              4 Core Determinants
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Tap factor cards to expand spatial audit telemetry
            </p>
          </div>
          <span className="px-space-sm py-1 rounded bg-surface-container-high font-label-sm text-label-sm text-primary">
            Explainable AI
          </span>
        </div>

        {/* 4 Factor Cards */}
        <div className="space-y-space-sm">
          {factors.map((factor: FactorCard) => {
            const isExpanded = expandedCards[factor.id] ?? true;

            return (
              <div
                key={factor.id}
                className="bg-surface-container rounded-2xl p-space-md shadow-md space-y-space-sm transition-all duration-200"
              >
                {/* Header (Tappable for Collapse/Expand) */}
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleCard(factor.id)}
                  className="w-full flex items-start justify-between gap-space-sm text-left"
                >
                  <div className="flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center text-tertiary shrink-0">
                      <Icon name={factor.icon} className="text-[22px]" />
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-label-lg font-bold text-on-surface">
                        {factor.title}
                      </h3>
                      <span className="font-label-sm text-label-sm text-tertiary font-semibold">
                        {factor.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="px-space-sm py-0.5 rounded-full bg-tertiary/20 text-tertiary font-label-md text-label-md font-bold">
                      +{factor.points} pts
                    </span>
                    <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">
                      {factor.impact_label}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <>
                    <div className="bg-surface-container-low rounded-xl p-space-sm space-y-space-xs">
                      <p className="font-body-md text-body-sm text-on-surface leading-snug">
                        <Segments segments={factor.narrative} />
                      </p>

                      {/* Factor-specific dynamic widgets */}
                      {factor.id === 'corridor' && factor.corridor && (
                        <div className="relative w-full h-28 rounded-lg overflow-hidden mt-space-xs bg-surface-container-lowest flex items-center justify-center border border-outline-variant/30">
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/20 to-transparent flex items-end justify-between p-space-sm">
                            <div className="flex items-center gap-1.5 font-label-sm text-[10px] text-on-surface">
                              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping" />
                              <span>Current: {factor.corridor.current_label}</span>
                            </div>
                            <span className="px-space-xs py-0.5 rounded bg-surface-container-highest/90 text-on-surface font-label-sm text-[10px]">
                              {factor.corridor.delta_label}
                            </span>
                          </div>
                        </div>
                      )}

                      {factor.id === 'dwell' && factor.dwell && (
                        <div className="mt-space-sm flex items-center gap-space-sm font-label-sm text-[11px] text-on-surface-variant">
                          <div className="flex items-center gap-1">
                            <Icon name="traffic" className="text-error text-[14px]" />
                            <span>DOT Congestion: {factor.dwell.dot_congestion_pct}%</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Icon name="bus_alert" className="text-secondary text-[14px]" />
                            <span>{factor.dwell.scheduled_stops} Scheduled Stops</span>
                          </div>
                        </div>
                      )}

                      {factor.id === 'advisory' && factor.advisory && (
                        <div className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded bg-surface-container-high font-label-sm text-[10px] text-on-surface-variant">
                          <Icon name="account_balance" className="text-[13px] text-primary" />
                          <span>Source: {factor.advisory.source}</span>
                        </div>
                      )}

                      {factor.id === 'environment' && factor.environment && (
                        <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                          {factor.environment.quadrants.map((quad) => (
                            <div
                              key={quad.id}
                              className="bg-surface-container-low rounded-xl p-space-sm flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between text-on-surface-variant">
                                <span className="font-label-sm text-[11px]">{quad.label}</span>
                                <Icon
                                  name={
                                    quad.id === 'lighting'
                                      ? 'lightbulb'
                                      : quad.id === 'cell'
                                      ? 'signal_cellular_alt'
                                      : quad.id === 'crowd'
                                      ? 'groups'
                                      : 'storefront'
                                  }
                                  className="text-secondary text-[16px]"
                                />
                              </div>
                              <div className="mt-space-xs">
                                <span className="font-headline-sm text-label-lg font-bold text-on-surface">
                                  {quad.value}
                                </span>
                                <span className="font-label-sm text-[10px] text-on-surface-variant block">
                                  {quad.sublabel}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Algorithmic Trace & Confidence */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-space-xs">
                        <Icon name="verified" className="text-secondary text-[16px]" />
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Confidence: <strong className="text-on-surface">{factor.confidence_pct}%</strong>
                        </span>
                      </div>
                      <span className="font-label-sm text-label-sm text-primary font-medium truncate max-w-[200px]">
                        {factor.trace}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Verified Safe Havens Preview Pill Card */}
        {nearest_haven && (
          <div className="bg-surface-container-low rounded-2xl p-space-md flex items-center justify-between">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon name="local_pharmacy" className="text-[20px]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-headline-sm text-label-md font-bold text-on-surface truncate">
                  Nearest Verified Safe Haven
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {nearest_haven.name} • {nearest_haven.distance_m}m {nearest_haven.direction} ({nearest_haven.note})
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Locate safe haven"
              onClick={() => navigate(`/havens?focus=${nearest_haven.id}`)}
              className="px-space-sm py-1.5 rounded-lg bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold shrink-0 active:scale-95 transition-transform"
            >
              Locate
            </button>
          </div>
        )}

        {/* Primary Interactive Actions & Interventions */}
        <div className="pt-space-xs space-y-space-sm">
          <button
            type="button"
            id="btn-simulate-reroute"
            onClick={handleSimulateReroute}
            disabled={simulateReroute.isPending}
            className="w-full h-14 rounded-2xl bg-primary text-on-primary font-headline-sm text-body-lg font-bold flex items-center justify-center gap-space-sm shadow-[0_0_24px_rgba(76,215,246,0.3)] active:scale-[0.98] transition-all"
          >
            <Icon name="alt_route" className="text-[22px]" />
            <span>{simulateReroute.isPending ? 'Simulating...' : 'Simulate Reroute to Main Boulevard'}</span>
          </button>

          <button
            type="button"
            id="btn-share-audit"
            onClick={handleShareAudit}
            disabled={notifyCircle.isPending}
            className="w-full h-12 rounded-2xl bg-surface-container-high text-on-surface font-headline-sm text-label-lg font-medium flex items-center justify-center gap-space-xs active:bg-surface-container-highest transition-colors"
          >
            <Icon name="share" className="text-[20px] text-primary" />
            <span>
              {notifyCircle.isPending ? 'Encrypting & Dispatching...' : 'Share Explainable Audit Log with Circle'}
            </span>
          </button>

          {/* Interactive Feedback Toast */}
          {inlineToast && (
            <div
              id="action-toast"
              className={`transition-all duration-300 rounded-xl p-space-sm flex items-center justify-center gap-space-xs font-label-md text-label-md ${
                inlineToast.isPrimary
                  ? 'bg-primary/20 text-primary'
                  : 'bg-secondary/15 text-secondary'
              }`}
            >
              <Icon name="task_alt" className="text-[18px]" />
              <span id="toast-message">{inlineToast.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Open Weighting Modal / Bottom Sheet */}
      {showWeightingSheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-4">
          <div className="w-full max-w-md bg-surface-container rounded-2xl p-space-lg shadow-2xl border border-outline-variant/30 space-y-space-md animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="tune" className="text-tertiary text-[20px]" />
                <h3 className="font-headline-sm text-on-surface font-bold">Algorithmic Weightings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWeightingSheet(false)}
                className="text-on-surface-variant hover:text-on-surface p-1"
                aria-label="Close"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>
            <p className="font-body-sm text-on-surface-variant">
              Risk score is calculated as a normalized multi-factor composite (0-100 scale). Safe threshold is{' '}
              <strong className="text-secondary">&lt; {safe_threshold}</strong>.
            </p>
            <div className="space-y-2">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between bg-surface-container-low p-2.5 rounded-xl">
                  <span className="font-label-md text-on-surface capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <span className="font-label-md text-primary font-mono font-bold">
                    {(val * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowWeightingSheet(false)}
              className="w-full py-2.5 rounded-xl bg-surface-container-high text-on-surface font-label-md font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FactorsPage;
