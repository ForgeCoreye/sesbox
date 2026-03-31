"use client";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { ApiKeyInput } from '../../components/ApiKeyInput';

type DraftResponse = {
  draftId?: string;
  id?: string;
};

export default function RecordPage() {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draftHref = useMemo(() => {
    return draftId ? `/draft/${draftId}` : null;
  }, [draftId]);

  const handleSuccess = (response: DraftResponse) => {
    const nextDraftId = response.draftId ?? response.id;
    if (!nextDraftId) {
      setError("Recording uploaded, but no draft ID was returned.");
      setDraftId(null);
      return;
    }

    setError(null);
    setDraftId(nextDraftId);
  };

  const handleError = (message: string) => {
    setError(message);
    setDraftId(null);
  };

  return (
    <main className="container" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        <header>
          <Link href="/" style={{ fontSize: "0.85rem", color: "var(--muted)", transition: "color 160ms ease" }}>
            &larr; Back to home
          </Link>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: "0.75rem 0 0" }}>
            Record a voice note
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.7, marginTop: "0.5rem" }}>
            Capture your thoughts, upload the audio, and turn it into a draft.
          </p>
        </header>

        <section style={{
          padding: "1.5rem",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(10px)",
          boxShadow: "var(--shadow)",
        }}>
          <VoiceRecorder onSuccess={handleSuccess} onError={handleError} />
        </section>

        <ApiKeyInput />

        {error ? (
          <div
            role="alert"
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "var(--radius-sm)",
              border: "1px solid #e8c4c4",
              background: "#fdf2f2",
              color: "#9b2c2c",
              fontSize: "0.92rem",
            }}
          >
            {error}
          </div>
        ) : null}

        {draftHref ? (
          <div style={{
            padding: "1.25rem 1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid #c6e8c6",
            background: "#f0fdf0",
          }}>
            <p style={{ fontWeight: 600, color: "#166534", margin: "0 0 0.75rem" }}>
              Draft created successfully.
            </p>
            <Link
              href={draftHref}
              className="btn btn--primary"
              style={{ fontSize: "0.9rem" }}
            >
              View draft
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}