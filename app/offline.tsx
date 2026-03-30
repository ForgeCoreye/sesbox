"use client";

import { useCallback } from "react";

function handleRetry() {
  if (typeof window === "undefined") return;

  try {
    window.location.reload();
  } catch {
    window.location.href = "/";
  }
}

export default function OfflinePage() {
  const onRetry = useCallback(() => {
    handleRetry();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <section
        aria-labelledby="offline-title"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl" aria-hidden="true">
          📡
        </div>

        <h1 id="offline-title" className="text-2xl font-semibold tracking-tight">
          You&apos;re offline
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We can&apos;t reach the network right now. Please check your internet connection and try again.
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Retry
          </button>

          <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">While you&apos;re offline, you can:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Check your internet connection or switch networks</li>
              <li>Review any saved drafts or local notes</li>
              <li>Try again once connectivity is restored</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}