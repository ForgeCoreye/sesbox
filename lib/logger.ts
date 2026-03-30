type LogLevel = "error" | "warn";

type ErrorLike = unknown;

interface LogPayload {
  timestamp: string;
  environment: string;
  level: LogLevel;
  message: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

const getEnvironment = (): string => {
  try {
    return process.env.NODE_ENV ?? "development";
  } catch {
    return "development";
  }
};

const isDevelopment = (): boolean => getEnvironment() !== "production";

const serializeError = (err: ErrorLike): LogPayload["error"] | undefined => {
  if (!err) return undefined;

  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }

  if (typeof err === "string") {
    return {
      message: err,
    };
  }

  if (typeof err === "object") {
    try {
      const maybeError = err as Record<string, unknown>;
      return {
        name: typeof maybeError.name === "string" ? maybeError.name : undefined,
        message: typeof maybeError.message === "string" ? maybeError.message : undefined,
        stack: typeof maybeError.stack === "string" ? maybeError.stack : undefined,
      };
    } catch {
      return {
        message: "Unknown error object",
      };
    }
  }

  return {
    message: String(err),
  };
};

const buildPayload = (level: LogLevel, message: string, err?: ErrorLike): LogPayload => {
  const payload: LogPayload = {
    timestamp: new Date().toISOString(),
    environment: getEnvironment(),
    level,
    message,
  };

  const serializedError = serializeError(err);
  if (serializedError) {
    payload.error = serializedError;
  }

  return payload;
};

const logToConsole = (payload: LogPayload): void => {
  const { level, message, timestamp, environment, error } = payload;
  const prefix = `[${timestamp}] [${environment}] [${level.toUpperCase()}] ${message}`;

  if (level === "error") {
    if (error) {
      console.error(prefix, error);
    } else {
      console.error(prefix);
    }
    return;
  }

  if (error) {
    console.warn(prefix, error);
  } else {
    console.warn(prefix);
  }
};

const prepareExternalLog = (_payload: LogPayload): void => {
  // Intentionally left as a centralized integration point for future
  // external logging providers (e.g. Sentry, Datadog, Logtail).
  // Keep route/UI layers thin by routing all logging through this module.
};

export function error(msg: string, err?: ErrorLike): void {
  const payload = buildPayload("error", msg, err);

  if (isDevelopment()) {
    logToConsole(payload);
    return;
  }

  try {
    prepareExternalLog(payload);
  } catch (loggingErr) {
    // Fallback to console to avoid losing critical diagnostics.
    logToConsole(buildPayload("error", `Logger failed while reporting error: ${msg}`, loggingErr));
  }
}

export function warn(msg: string): void {
  const payload = buildPayload("warn", msg);

  if (isDevelopment()) {
    logToConsole(payload);
    return;
  }

  try {
    prepareExternalLog(payload);
  } catch (loggingErr) {
    logToConsole(buildPayload("warn", `Logger failed while reporting warning: ${msg}`, loggingErr));
  }
}