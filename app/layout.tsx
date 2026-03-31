"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
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

  return (
    <html lang="en">
      <body>
        <nav className="site-nav">
          <div className="container site-nav__inner">
            <a href="/" className="site-nav__brand">Sesbox</a>
            <div className="site-nav__links">
              <a href="/record" className="site-nav__link">Record</a>
              <a href="/dashboard" className="site-nav__link">Dashboard</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}