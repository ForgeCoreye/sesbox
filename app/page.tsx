import type { Metadata } from "next";
import { WaitlistForm } from '../components/WaitlistForm';

export const metadata: Metadata = {
  title: "sesbox — Voice-first creator SaaS",
  description: "Turn voice notes into publishable drafts. Join the waitlist for early access.",
};

export default function HomePage() {
  return (
    <main className="home">
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container">
          <span className="badge">Voice-first creator tool</span>
          <h1 className="hero__headline">
            Talk it out.&nbsp;
            <span className="accent">Ship it clean.</span>
          </h1>
          <p className="hero__sub">
            Record a voice note. Sesbox turns it into a polished, publish-ready
            draft — no editing spiral, no blank-page dread.
          </p>
          <div className="hero__cta-group">
            <a href="#waitlist" className="btn btn--primary">
              Join the waitlist
            </a>
            <a href="#how-it-works" className="btn btn--ghost">
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="workflow">
        <div className="container">
          <h2 className="section-title">From voice to published in three steps</h2>
          <ol className="workflow__steps">
            <WorkflowStep
              number="01"
              title="Record"
              description="Open Sesbox and speak. No script needed — raw thoughts are fine."
            />
            <WorkflowStep
              number="02"
              title="Review"
              description="We transcribe, structure, and tighten your words into a clean draft."
            />
            <WorkflowStep
              number="03"
              title="Publish"
              description="Copy to your platform of choice or export directly. Done."
            />
          </ol>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="social-proof">
        <div className="container">
          <h2 className="section-title">Early creators are shipping faster</h2>
          <div className="testimonials">
            <TestimonialCard
              quote="I recorded a 90-second voice note and had a LinkedIn post ready in under two minutes."
              author="— Beta tester, solo founder"
            />
            <TestimonialCard
              quote="This is the first tool that matches how my brain actually works."
              author="— Beta tester, newsletter writer"
            />
            <TestimonialCard
              quote="Sesbox cut my content creation time in half. I just talk now."
              author="— Beta tester, indie maker"
            />
          </div>
          <p className="social-proof__disclaimer">
            Testimonials from closed beta participants.
          </p>
        </div>
      </section>

      {/* ── CTA / Waitlist ── */}
      <section id="waitlist" className="cta">
        <div className="container cta__inner">
          <h2 className="cta__headline">Ready to stop staring at a blank page?</h2>
          <p className="cta__sub">
            Join the waitlist. We&apos;ll let you in as spots open.
          </p>
          <WaitlistForm className="waitlist-form" />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container footer__inner">
          <span className="footer__brand">Sesbox</span>
          <span className="footer__copy">
            &copy; {new Date().getFullYear()} Sesbox. All rights reserved.
          </span>
        </div>
      </footer>
    </main>
  );
}

/* ── Sub-components ── */

function WorkflowStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <li className="workflow__step">
      <span className="workflow__number" aria-hidden="true">{number}</span>
      <h3 className="workflow__step-title">{title}</h3>
      <p className="workflow__step-desc">{description}</p>
    </li>
  );
}

function TestimonialCard({ quote, author }: { quote: string; author: string }) {
  return (
    <blockquote className="testimonial">
      <p className="testimonial__quote">{quote}</p>
      <footer className="testimonial__author">{author}</footer>
    </blockquote>
  );
}
