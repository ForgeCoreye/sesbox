export type TranscribeAnalyticsEvent =
  | {
      name: "transcribe_start";
      timestamp: number;
      requestId?: string;
      metadata?: Record<string, unknown>;
    }
  | {
      name: "transcribe_complete";
      timestamp: number;
      durationMs: number;
      requestId?: string;
      metadata?: Record<string, unknown>;
    }
  | {
      name: "transcribe_error";
      timestamp: number;
      durationMs?: number;
      requestId?: string;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
    };

type TranscribeStartInput = {
  requestId?: string;
  metadata?: Record<string, unknown>;
};

type TranscribeCompleteInput = {
  startedAt: number;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

type TranscribeErrorInput = {
  startedAt?: number;
  requestId?: string;
  error: unknown;
  metadata?: Record<string, unknown>;
};

const MAX_BUFFER_SIZE = 100;

const globalForDeepgramAdapter = globalThis as typeof globalThis & {
  __sesboxTranscribeAnalyticsBuffer?: TranscribeAnalyticsEvent[];
};

const analyticsBuffer: TranscribeAnalyticsEvent[] =
  globalForDeepgramAdapter.__sesboxTranscribeAnalyticsBuffer ?? [];
globalForDeepgramAdapter.__sesboxTranscribeAnalyticsBuffer = analyticsBuffer;

function now(): number {
  return Date.now();
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown transcription error";
  }
}

function safeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  try {
    return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function pushEvent(event: TranscribeAnalyticsEvent): void {
  try {
    analyticsBuffer.push(event);
    if (analyticsBuffer.length > MAX_BUFFER_SIZE) {
      analyticsBuffer.splice(0, analyticsBuffer.length - MAX_BUFFER_SIZE);
    }
  } catch {
    // Never let analytics break transcription flow.
  }
}

export function getTranscribeAnalyticsBuffer(): TranscribeAnalyticsEvent[] {
  return [...analyticsBuffer];
}

export function clearTranscribeAnalyticsBuffer(): void {
  try {
    analyticsBuffer.length = 0;
  } catch {
    // no-op
  }
}

export function logTranscribeStart(input: TranscribeStartInput = {}): number {
  const timestamp = now();

  pushEvent({
    name: "transcribe_start",
    timestamp,
    requestId: input.requestId,
    metadata: safeMetadata(input.metadata),
  });

  return timestamp;
}

export function logTranscribeComplete(input: TranscribeCompleteInput): void {
  const timestamp = now();
  const durationMs = Math.max(0, timestamp - input.startedAt);

  pushEvent({
    name: "transcribe_complete",
    timestamp,
    durationMs,
    requestId: input.requestId,
    metadata: safeMetadata(input.metadata),
  });
}

export function logTranscribeError(input: TranscribeErrorInput): void {
  const timestamp = now();
  const durationMs =
    typeof input.startedAt === "number" ? Math.max(0, timestamp - input.startedAt) : undefined;

  pushEvent({
    name: "transcribe_error",
    timestamp,
    durationMs,
    requestId: input.requestId,
    errorMessage: safeErrorMessage(input.error),
    metadata: safeMetadata(input.metadata),
  });
}

export async function withTranscribeAnalytics<T>(
  operation: () => Promise<T>,
  input: TranscribeStartInput = {},
): Promise<T> {
  const startedAt = logTranscribeStart(input);

  try {
    const result = await operation();
    logTranscribeComplete({
      startedAt,
      requestId: input.requestId,
      metadata: input.metadata,
    });
    return result;
  } catch (error) {
    logTranscribeError({
      startedAt,
      requestId: input.requestId,
      error,
      metadata: input.metadata,
    });
    throw error;
  }
}