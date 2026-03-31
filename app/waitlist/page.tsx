"use client";

import { useState } from "react";

export const dynamic = "force-dynamic";

type SubmissionState = "idle" | "submitting" | "success" | "error";

type WaitlistResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState<string>("");
  const [fieldError, setFieldError] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setFieldError("Please enter a valid email address.");
      setState("error");
      setMessage("");
      return;
    }

    setFieldError("");
    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          clerkUserId: null,
          name: null,
        }),
      });

      const data = (await response.json().catch(() => null)) as WaitlistResponse | null;

      if (!response.ok || !data?.success) {
        const errorMessage =
          data?.error ||
          data?.message ||
          (response.status === 409 ? "This email is already on the waitlist." : "Something went wrong. Please try again.");
        setState("error");
        setMessage(errorMessage);
        return;
      }

      setState("success");
      setMessage(data.message || "You're on the waitlist. We'll be in touch soon.");
      setEmail("");
    } catch (error) {
      console.error("Waitlist submission failed:", error);
      setState("error");
      setMessage("Unable to submit right now. Please try again in a moment.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Waitlist</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Turn voice notes into publishable drafts.
          </h1>
          <p className="mt-3 text-base leading-7 text-neutral-600">
            Join the waitlist for early access to a lightweight creator workflow built for fast drafting and publishing.
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
          <span>
            Sign in is optional. Enter your email below to reserve your spot.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-900">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldError) setFieldError("");
                if (state !== "idle") setState("idle");
              }}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:border-neutral-950"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "email-error" : undefined}
              disabled={state === "submitting"}
            />
            {fieldError ? (
              <p id="email-error" className="mt-2 text-sm text-red-600">
                {fieldError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={state === "submitting"}
            className="inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "submitting" ? "Joining..." : "Join waitlist"}
          </button>
        </form>

        {state === "success" ? (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {message || "Success! You're on the waitlist."}
          </div>
        ) : state === "error" && message ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {message}
          </div>
        ) : null}

        <p className="mt-6 text-xs leading-5 text-neutral-500">
          We only use your email to manage the waitlist and send launch updates. No spam.
        </p>
      </section>
    </main>
  );
}