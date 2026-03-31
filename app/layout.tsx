"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

type AnalyticsLike = {
  flush?: () => void | Promise<void>;
};

function getAnalytics(): AnalyticsLike | null {
  try {
    const globalAny = globalThis as typeof globalThis & {
      analytics?: AnalyticsLike;
    };

    if (globalAny.analytics && typeof globalAny.analytics.flush === "function") {
      return globalAny.analytics;
    }

    return null;
  } catch {
    return null;
  }
}

function flushAnalyticsSafely(): void {
  try {
    const analytics = getAnalytics();
    if (!analytics) return;

    const result = analytics.flush?.();
    if (result && typeof (result as Promise<void>).catch === "function") {
      void (result as Promise<void>).catch(() => {
        // Intentionally swallow flush errors during unload to avoid blocking navigation.
      });
    }
  } catch {
    // Never block unload or crash the app due to analytics failures.
  }
}

function useAnalyticsUnloadFlush(): void {
  useEffect(() => {
    const handlePageHide = (): void => {
      flushAnalyticsSafely();
    };

    const handleBeforeUnload = (): void => {
      flushAnalyticsSafely();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  useAnalyticsUnloadFlush();
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body>
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}