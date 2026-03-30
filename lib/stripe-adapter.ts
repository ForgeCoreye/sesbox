export type AnalyticsEventName =
  | "waitlist_signup"
  | "record_start"
  | "transcribe_complete"
  | "export"
  | "error";

export type AnalyticsEventProperties = Record<string, unknown>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  timestamp: string;
  properties: AnalyticsEventProperties;
}

export interface WaitlistSignupInput {
  email?: string | null;
  timestamp?: string | Date;
  [key: string]: unknown;
}

const MAX_BUFFER_SIZE = 50;

const eventBuffer: AnalyticsEvent[] = [];

function toIsoTimestamp(value?: string | Date): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function safeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeProperties(properties: AnalyticsEventProperties): AnalyticsEventProperties {
  const sanitized: AnalyticsEventProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue;
    if (value === null) {
      sanitized[key] = null;
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
      continue;
    }

    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
      continue;
    }

    try {
      sanitized[key] = JSON.parse(JSON.stringify(value));
    } catch {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

function enqueueEvent(event: AnalyticsEvent): void {
  try {
    eventBuffer.push(event);

    if (eventBuffer.length > MAX_BUFFER_SIZE) {
      eventBuffer.splice(0, eventBuffer.length - MAX_BUFFER_SIZE);
    }
  } catch (error) {
    console.error("[analytics] Failed to enqueue event", error);
  }
}

export function trackEvent(
  name: AnalyticsEventName,
  properties: AnalyticsEventProperties = {},
  timestamp?: string | Date
): AnalyticsEvent {
  const event: AnalyticsEvent = {
    name,
    timestamp: toIsoTimestamp(timestamp),
    properties: sanitizeProperties(properties),
  };

  enqueueEvent(event);
  return event;
}

export function trackWaitlistSignup(input: WaitlistSignupInput): AnalyticsEvent | null {
  try {
    const email = safeString(input.email);

    if (!email) {
      console.warn("[analytics] waitlist_signup skipped: missing email");
      return null;
    }

    return trackEvent("waitlist_signup", {
      email,
      timestamp: toIsoTimestamp(input.timestamp),
    });
  } catch (error) {
    console.error("[analytics] Failed to track waitlist signup", error);
    return null;
  }
}

export function getAnalyticsBuffer(): readonly AnalyticsEvent[] {
  return eventBuffer;
}

export function flushAnalyticsBuffer(): AnalyticsEvent[] {
  try {
    const flushed = [...eventBuffer];
    eventBuffer.length = 0;
    return flushed;
  } catch (error) {
    console.error("[analytics] Failed to flush analytics buffer", error);
    return [];
  }
}

export function clearAnalyticsBuffer(): void {
  try {
    eventBuffer.length = 0;
  } catch (error) {
    console.error("[analytics] Failed to clear analytics buffer", error);
  }
}

export function recordSuccessfulStripeCheckout(input: WaitlistSignupInput): AnalyticsEvent | null {
  return trackWaitlistSignup(input);
}