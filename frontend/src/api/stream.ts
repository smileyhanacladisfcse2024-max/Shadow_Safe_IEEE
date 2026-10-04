import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './hooks';
import type { JourneySnapshot, SOSStatus } from './types';

export const CHECKIN_EVENT_NAME = 'shadowsafe:checkin';

export function useSseStream() {
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<number | null>(null);
  const backoffRef = useRef(1000);
  const isConnectedRef = useRef(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isCancelled = false;

    function connect() {
      if (isCancelled) return;

      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onopen = () => {
          isConnectedRef.current = true;
          backoffRef.current = 1000;
        };

        eventSource.addEventListener('journey', (e: MessageEvent) => {
          try {
            const snapshot = JSON.parse(e.data) as JourneySnapshot;
            queryClient.setQueryData(queryKeys.journey, snapshot);
            // Invalidate connected queries
            queryClient.invalidateQueries({ queryKey: queryKeys.risk });
            queryClient.invalidateQueries({ queryKey: queryKeys.routes });
            queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
          } catch (err) {
            console.error('Failed to parse SSE journey event', err);
          }
        });

        eventSource.addEventListener('sos', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as { state: string; timestamp: string };
            queryClient.setQueryData<SOSStatus>(queryKeys.sos, (prev: SOSStatus | undefined) => ({
              state: data.state,
              deadline_at: prev?.deadline_at,
              server_time: prev?.server_time,
              grace_s: prev?.grace_s,
            }));
            queryClient.invalidateQueries({ queryKey: queryKeys.guardians });
            queryClient.invalidateQueries({ queryKey: queryKeys.journey });
          } catch (err) {
            console.error('Failed to parse SSE sos event', err);
          }
        });

        eventSource.addEventListener('checkin', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as { timestamp: string };
            window.dispatchEvent(new CustomEvent(CHECKIN_EVENT_NAME, { detail: data }));
          } catch (err) {
            console.error('Failed to parse SSE checkin event', err);
          }
        });

        eventSource.onerror = () => {
          isConnectedRef.current = false;
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          if (!isCancelled) {
            const delay = backoffRef.current;
            backoffRef.current = Math.min(backoffRef.current * 1.5, 10000);
            reconnectTimeoutRef.current = window.setTimeout(connect, delay);
          }
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
        if (!isCancelled) {
          reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isCancelled = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);
}
