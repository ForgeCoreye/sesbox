import Link from "next/link";

type WorkflowStep = {
  title: string;
  description: string;
  accent: string;
};

const workflowSteps: WorkflowStep[] = [
  {
    title: "Record",
    description: "Capture a voice note from your phone, desktop, or browser in seconds.",
    accent: "from-sky-500/20 to-cyan-500/20",
  },
  {
    title: "Transcribe",
    description: "Turn spoken ideas into a clean, structured draft with speaker-aware formatting.",
    accent: "from-violet-500/20 to-fuchsia-500/20",
  },
  {
    title: "Export",
    description: "Send the draft to your writing stack and publish faster with less friction.",
    accent: "from-emerald-500/20 to-lime-500/20",
  },
];

const sampleTranscript = [
  { speaker: "You", text: "I want a short launch post that explains the product in one sentence." },
  { speaker: "sesbox", text: "Draft: Turn voice notes into publishable content in minutes." },
  { speaker: "You", text: "Add a clear CTA and keep it friendly." },
  { speaker: "sesbox", text: "CTA: Join the waitlist to try the demo and get early access." },
];

function DemoBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 shadow-sm backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      Public demo preview
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_30%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <DemoBadge />
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Voice notes that become publishable drafts.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            sesbox helps creators capture ideas fast, transcribe them cleanly, and export ready-to-share content without
            breaking flow.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Join waitlist
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              See workflow
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-400">
            No setup required. Built for fast capture, clear output, and a lightweight creator workflow.
          </p>
        </div>

        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur">
          <div className="rounded-2xl border border-white/10 bg-slate-950 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Live demo preview</p>
                <p className="text-xs text-slate-400">Read-only sample output</p>
              </div>
              <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Ready to export
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {sampleTranscript.map((line, index) => (
                <div
                  key={`${line.speaker}-${index}`}
                  className={`rounded-2xl px-4 py-3 ${
                    line.speaker === "You" ? "bg-white/5 text-slate-100" : "bg-cyan-400/10 text-cyan-50"
                  }`}
                >
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {line.speaker}
                  </div>
                  <p className="text-sm leading-6">{line.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sample export</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                “Turn voice notes into publishable content in minutes. Join the waitlist to try the demo and get early
                access.”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkflowGrid() {
  return (
    <section id="workflow" className="bg-slate-950 px-6 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Workflow</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A simple three-step path from idea to draft.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Designed to keep the experience visual, fast, and easy to understand at a glance.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/10"
            >
              <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${step.accent} px-4 py-2`}>
                <span className="text-sm font-semibold text-white">0{index + 1}</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TranscriptPreview() {
  return (
    <section className="bg-slate-950 px-6 pb-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Sample transcript</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">What the output looks like</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              A clean transcript preview helps users understand the value immediately before they sign up.
            </p>

            <div className="mt-6 space-y-4">
              {sampleTranscript.map((line, index) => (
                <div key={`preview-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{line.speaker}</span>
                    <span className="text-xs text-slate-500">Line {index + 1}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-100">{line.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Waitlist CTA</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Get early access to the demo</h2>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Join the waitlist to be first in line when the full workflow opens up.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Checkout link</p>
              <p className="mt-2 break-all text-sm text-slate-200">
                {process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ?? "NEXT_PUBLIC_STRIPE_CHECKOUT_URL="}
              </p>
            </div>

            <Link
              href={process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Join waitlist
            </Link>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Configure the checkout URL via <code className="rounded bg-white/5 px-1 py-0.5">NEXT_PUBLIC_STRIPE_CHECKOUT_URL</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DemoPage() {
  try {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <HeroSection />
        <WorkflowGrid />
        <TranscriptPreview />
      </main>
    );
  } catch {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-16 text-white sm:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8">
          <h1 className="text-2xl font-semibold">Demo page unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-red-100">
            Something went wrong while rendering the demo landing page. Please try again later.
          </p>
        </div>
      </main>
    );
  }
}