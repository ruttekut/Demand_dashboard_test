import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { TelemetryEvent } from '../types';

interface TelemetryContextValue {
  events: TelemetryEvent[];
  track: (event: TelemetryEvent['name'], payload?: TelemetryEvent['payload']) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | undefined>(undefined);

export const TelemetryProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const buffer = useRef<TelemetryEvent[]>([]);

  const flush = useCallback(() => {
    if (buffer.current.length === 0) return;
    setEvents((prev) => [...prev, ...buffer.current]);
    buffer.current = [];
  }, []);

  const track = useCallback<TelemetryContextValue['track']>((name, payload) => {
    const event: TelemetryEvent = {
      name,
      payload,
      occurredAt: new Date().toISOString()
    };
    buffer.current.push(event);
    if (typeof window !== 'undefined') {
      window.requestIdleCallback?.(flush);
      if (!window.requestIdleCallback) {
        setTimeout(flush, 100);
      }
    } else {
      flush();
    }
  }, [flush]);

  const value = useMemo(() => ({ events, track }), [events, track]);

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
};

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetry must be used within TelemetryProvider');
  }
  return ctx;
};
