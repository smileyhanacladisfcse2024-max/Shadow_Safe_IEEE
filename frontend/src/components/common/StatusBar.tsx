import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { formatCurrentDeviceTime } from '../../utils/format';

export const SHOW_FAKE_STATUS_BAR = true;

export function StatusBar() {
  const [time, setTime] = useState(formatCurrentDeviceTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatCurrentDeviceTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!SHOW_FAKE_STATUS_BAR) return null;

  return (
    <div className="h-6 px-margin flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant select-none lg:hidden">
      <span>{time}</span>
      <div className="flex items-center gap-space-xs">
        <Icon name="signal_cellular_alt" className="text-[14px]" />
        <Icon name="wifi" className="text-[14px]" />
        <Icon name="battery_full" className="text-[14px]" />
      </div>
    </div>
  );
}
