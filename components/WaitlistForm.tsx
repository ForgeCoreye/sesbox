"use client";

import React, { useMemo, useState } from "react";

type SubmitStatus = "idle" | "loading" | "success" | "error";

type WaitlistFormProps = {
  className?: string;
  onSuccess?: (email: string) => void;
  onSubmit?: (email: string) => Promise<void>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

function getErrorMessage(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return "Email is required.";
  }

  if (!isValidEmail(trimmed)) {
    return "Please enter a valid email address.";
  }

  return null;
}

async function defaultSubmit(email: string): Promise<void> {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const data: unknown = await response.json();
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
      ) {
        message = (data as { error: string }).error;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to generic message.
    }

    throw new Error(message);
  }
}

export default function WaitlistForm({
  className,
  onSuccess,
  onSubmit,
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [touched, setTouched] = useState(false);

  const validationError = useMemo(() => {
    if (!touched && !email) return null;
    return getErrorMessage(email);
  }, [email, touched]);

  const submitHandler = onSubmit ?? defaultSubmit;
  const inputId = "waitlist-email";
  const errorId = "waitlist-email-error";
  const messageId = "waitlist-form-message";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = getErrorMessage(email);
    setTouched(true);

    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      await submitHandler(email.trim().toLowerCase());
      setStatus("success");
      setMessage("Thanks! You're on the waitlist.");
      setEmail("");
      onSuccess?.(email.trim().toLowerCase());
    } catch (err) {
      const fallback = "Unable to join the waitlist right now. Please try again.";
      const nextMessage =
        err instanceof Error && err.message ? err.message : fallback;

      setStatus("error");
      setMessage(nextMessage);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmail(event.target.value);
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  }

  function handleBlur() {
    setTouched(true);
  }

  const showError = Boolean(validationError) && (touched || status === "error");
  const describedBy = [
    showError ? errorId : null,
    message ? messageId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <form className={className} onSubmit={handleSubmit} noValidate>
      <div className="space-y-3">
        <div>
          <label htmlFor={inputId} className="block text-sm font-medium">
            Email address
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id={inputId}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showError ? "true" : "false"}
              aria-describedby={describedBy}
              disabled={status === "loading"}
              placeholder="you@example.com"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-black disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Joining..." : "Join waitlist"}
            </button>
          </div>
        </div>

        {showError ? (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {validationError}
          </p>
        ) : null}

        {message ? (
          <p
            id={messageId}
            role={status === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`text-sm ${
              status === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
export { WaitlistForm }
