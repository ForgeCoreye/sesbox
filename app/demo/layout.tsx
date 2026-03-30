import type { Metadata } from "next";
import type { ReactNode } from "react";

const DEMO_TITLE = "Demo | sesbox";
const DEMO_DESCRIPTION =
  "See how sesbox turns voice notes into publishable drafts with a simple record → transcribe → export workflow.";
const DEMO_KEYWORDS = [
  "sesbox demo",
  "voice notes to drafts",
  "voice-first creator SaaS",
  "transcription workflow",
  "content creation tool",
];

export const metadata: Metadata = {
  title: DEMO_TITLE,
  description: DEMO_DESCRIPTION,
  keywords: DEMO_KEYWORDS,
  alternates: {
    canonical: "/demo",
  },
  openGraph: {
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
    url: "/demo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: DEMO_TITLE,
    description: DEMO_DESCRIPTION,
  },
};

function DemoHeader() {
  return (
    <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-semibold">s</span>
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">sesbox</p>
            <p className="text-xs text-muted-foreground">Voice-first creator SaaS</p>
          </div>
        </div>

        <nav aria-label="Demo navigation" className="flex items-center gap-4 text-sm">
          <a
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </a>
          <a
            href="/waitlist"
            className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Join waitlist
          </a>
        </nav>
      </div>
    </header>
  );
}

function DemoFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} sesbox</p>
        <p>Record, transcribe, export — built for creators.</p>
      </div>
    </footer>
  );
}

export default function DemoLayout({ children }: { children: ReactNode }) {
  try {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DemoHeader />
        <main>{children}</main>
        <DemoFooter />
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <DemoHeader />
        <main>
          <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              Something went wrong while loading the demo page.
            </div>
          </div>
        </main>
        <DemoFooter />
      </div>
    );
  }
}