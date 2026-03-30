import type { Metadata } from "next";
import { WaitlistForm } from '../components/WaitlistForm';

export const metadata: Metadata = {
  title: "sesbox — Voice-first creator SaaS",
  description: "Turn voice notes into publishable drafts. Join the waitlist for early access.",
};

function DemoSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur sm:p-8">
        <div className="mb-6 flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">
            Demo
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            See how sesbox turns voice into drafts
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
            Record a voice note, get a structured draft, and move from idea to publishable content faster.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">1. Capture</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Drop in a voice note or quick thought and let the system handle the first pass.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">2. Structure</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Convert raw speech into a clean outline with key points, hooks, and next steps.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm font-medium text-white">3. Publish</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Refine the draft and export it into a format ready for your audience.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-16">
        <div className="flex-1">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
            Voice-first creator SaaS
          </div>

          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Turn voice notes into publishable drafts.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
            Capture ideas faster, structure them automatically, and move from rough thoughts to polished content with less friction.
          </p>

          <div className="mt-8 max-w-xl">
            <WaitlistForm />
          </div>
        </div>

        <div className="flex-1">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Input</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  “I want to write a post about how creators can use voice notes to draft faster.”
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">Output</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  A clear outline, headline options, and a first draft ready to edit and publish.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DemoSection />
    </main>
  );
}