import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Icon } from './Icon';

export interface ToastOptions {
  message: string;
  icon?: string;
  variant?: 'tertiary' | 'primary' | 'error';
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string) => void;
  inlineToast: ToastOptions | null;
  setInlineToast: (toast: ToastOptions | null) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const [inlineToast, setInlineToast] = useState<ToastOptions | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback((options: ToastOptions | string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const toastData: ToastOptions =
      typeof options === 'string'
        ? { message: options, icon: 'check_circle', variant: 'tertiary' }
        : {
            icon: options.icon || (options.variant === 'error' ? 'error' : 'check_circle'),
            variant: options.variant || 'tertiary',
            durationMs: options.durationMs || 3000,
            message: options.message,
          };

    setToast(toastData);

    timerRef.current = window.setTimeout(() => {
      setToast(null);
    }, toastData.durationMs || 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, inlineToast, setInlineToast }}>
      {children}
      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-4 right-4 bg-surface-container-highest/95 backdrop-blur-md p-3 rounded-xl shadow-2xl flex items-center justify-between z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 border border-outline-variant/30"
        >
          <div className="flex items-center gap-2">
            <Icon
              name={toast.icon || 'check_circle'}
              className={`text-[20px] ${
                toast.variant === 'error'
                  ? 'text-error'
                  : toast.variant === 'primary'
                  ? 'text-primary'
                  : 'text-tertiary'
              }`}
            />
            <span className="font-body-sm text-body-sm text-on-surface font-medium">
              {toast.message}
            </span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-on-surface-variant hover:text-on-surface p-1 ml-2"
            aria-label="Dismiss toast"
          >
            <Icon name="close" className="text-[16px]" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function InlineToastBanner({
  toast,
  onDismiss,
}: {
  toast: ToastOptions;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="status"
      className="p-space-sm rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-between gap-space-xs text-primary shadow-sm"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon name={toast.icon || 'insights'} className="text-[18px] text-primary shrink-0" />
        <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">
          {toast.message}
        </span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-on-surface-variant hover:text-on-surface p-1 shrink-0"
          aria-label="Dismiss message"
        >
          <Icon name="close" className="text-[16px]" />
        </button>
      )}
    </div>
  );
}
