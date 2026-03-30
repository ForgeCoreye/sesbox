export type AnalyticsEventName =
  | 'signup'
  | 'record_start'
  | 'transcribe_complete'
  | 'export'
  | 'error';

export type AnalyticsBasePayload = Record<string, unknown>;

export interface SignupEventPayload extends AnalyticsBasePayload {
  source?: string;
  plan?: string;
  referrer?: string;
}

export interface RecordStartEventPayload extends AnalyticsBasePayload {
  sessionId?: string;
  source?: string;
  hasMicrophonePermission?: boolean;
}

export interface TranscribeCompleteEventPayload extends AnalyticsBasePayload {
  sessionId?: string;
  durationMs?: number;
  transcriptLength?: number;
  success?: boolean;
}

export interface ExportEventPayload extends AnalyticsBasePayload {
  sessionId?: string;
  format?: string;
  destination?: string;
  success?: boolean;
}

export interface ErrorEventPayload extends AnalyticsBasePayload {
  message?: string;
  code?: string;
  stack?: string;
  context?: string;
}

export type AnalyticsEventPayloadMap = {
  signup: SignupEventPayload;
  record_start: RecordStartEventPayload;
  transcribe_complete: TranscribeCompleteEventPayload;
  export: ExportEventPayload;
  error: ErrorEventPayload;
};

export interface AnalyticsEvent<T extends AnalyticsEventName = AnalyticsEventName> {
  name: T;
  payload: AnalyticsEventPayloadMap[T];
  timestamp: number;
  id: string;
}

export interface AnalyticsConfig {
  flushThreshold?: number;
  flushIntervalMs?: number;
  debug?: boolean;
  transport?: (events: AnalyticsEvent[]) => Promise<void> | void;
}

const DEFAULT_FLUSH_THRESHOLD = 5;
const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

const buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let isFlushing = false;
let isInitialized = false;

const config: Required<Pick<AnalyticsConfig, 'flushThreshold' | 'flushIntervalMs' | 'debug'>> & {
  transport: NonNullable<AnalyticsConfig['transport']>;
} = {
  flushThreshold: DEFAULT_FLUSH_THRESHOLD,
  flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
  debug: false,
  transport: async (events: AnalyticsEvent[]) => {
    console.log('[analytics] flush', events);
  },
};

function now(): number {
  return Date.now();
}

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // ignore
  }
  return `evt_${Math.random().toString(36).slice(2)}_${now().toString(36)}`;
}

function safeLog(...args: unknown[]): void {
  try {
    console.log(...args);
  } catch {
    // ignore logging failures
  }
}

function scheduleFlush(): void {
  if (typeof window === 'undefined') return;
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, config.flushIntervalMs);
}

function clearFlushTimer(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
}

function shouldFlush(): boolean {
  return buffer.length >= config.flushThreshold;
}

function normalizePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  return payload as Record<string, unknown>;
}

export function initAnalytics(options: AnalyticsConfig = {}): void {
  config.flushThreshold = Math.max(1, options.flushThreshold ?? DEFAULT_FLUSH_THRESHOLD);
  config.flushIntervalMs = Math.max(1_000, options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS);
  config.debug = Boolean(options.debug);
  config.transport = options.transport ?? config.transport;

  if (isInitialized) return;
  isInitialized = true;

  if (typeof window !== 'undefined') {
    const onUnload = () => {
      void flush({ sync: true });
    };

    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('pagehide', onUnload);
    scheduleFlush();
  }

  if (config.debug) {
    safeLog('[analytics] initialized', {
      flushThreshold: config.flushThreshold,
      flushIntervalMs: config.flushIntervalMs,
    });
  }
}

export function track<T extends AnalyticsEventName>(
  name: T,
  payload: AnalyticsEventPayloadMap[T]
): void {
  try {
    const event: AnalyticsEvent<T> = {
      name,
      payload: normalizePayload(payload) as AnalyticsEventPayloadMap[T],
      timestamp: now(),
      id: createId(),
    };

    buffer.push(event);

    if (config.debug) {
      safeLog('[analytics] track', event);
    }

    if (shouldFlush()) {
      void flush();
      return;
    }

    scheduleFlush();
  } catch (error) {
    safeLog('[analytics] track failed', error);
  }
}

export async function flush(options: { sync?: boolean } = {}): Promise<void> {
  if (isFlushing) return;
  if (buffer.length === 0) {
    clearFlushTimer();
    return;
  }

  isFlushing = true;
  clearFlushTimer();

  const events = buffer.splice(0, buffer.length);

  try {
    if (config.debug) {
      safeLog('[analytics] flushing', { count: events.length, sync: Boolean(options.sync) });
    }

    const result = config.transport(events);
    if (result && typeof (result as Promise<void>).then === 'function') {
      await result;
    }

    if (config.debug) {
      safeLog('[analytics] flush complete', { count: events.length });
    }
  } catch (error) {
    buffer.unshift(...events);
    safeLog('[analytics] flush failed', error);
  } finally {
    isFlushing = false;
    if (buffer.length > 0) {
      scheduleFlush();
    }
  }
}

export function trackSignup(payload: SignupEventPayload = {}): void {
  track('signup', payload);
}

export function trackRecordStart(payload: RecordStartEventPayload = {}): void {
  track('record_start', payload);
}

export function trackTranscribeComplete(payload: TranscribeCompleteEventPayload = {}): void {
  track('transcribe_complete', payload);
}

export function trackExport(payload: ExportEventPayload = {}): void {
  track('export', payload);
}

export function trackError(payload: ErrorEventPayload = {}): void {
  track('error', payload);
}

export function getAnalyticsBufferSize(): number {
  return buffer.length;
}

export function resetAnalyticsForTesting(): void {
  buffer.splice(0, buffer.length);
  clearFlushTimer();
  isFlushing = false;
  isInitialized = false;
}