"use client";

import { useCallback, useState } from "react";
import { VoiceUploader } from '../../components/voice-uploader';
import { DraftCard } from '../../components/draft-card';

import { ApiKeyInput } from '../../components/ApiKeyInput';

export default function DashboardPage() {
  const [transcript, setTranscript] = useState<string>("");
  const [draftKey, setDraftKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptReady = useCallback((nextTranscript: string) => {
    const normalized = typeof nextTranscript === "string" ? nextTranscript.trim() : "";
    if (!normalized) {
      setError("No transcript was returned. Please try again.");
      setTranscript("");
      return;
    }
    setError(null);
    setTranscript(normalized);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
    setTranscript("");
  }, []);

  const handleReset = useCallback(() => {
    setTranscript("");
    setError(null);
    setDraftKey((current) => current + 1);
  }, []);

  return (
    <main className="container" style={{ paddingTop: "3rem", paddingBottom: "4rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        <header style={{ marginBottom: "0.5rem" }}>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.7, marginTop: "0.5rem" }}>
            Upload an audio file and get your transcript instantly.
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
          <VoiceUploader
            key={draftKey}
            onTranscriptReady={handleTranscriptReady}
            onError={handleError}
            onReset={handleReset}
          />
        </section>

        <ApiKeyInput />

        {error && (
          <section style={{
            padding: "1rem 1.25rem",
            borderRadius: "var(--radius-sm)",
            border: "1px solid #e8c4c4",
            background: "#fdf2f2",
            color: "#9b2c2c",
            fontSize: "0.92rem",
          }}>
            {error}
          </section>
        )}

        {transcript && (
          <section style={{
            padding: "1.5rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(10px)",
            boxShadow: "var(--shadow)",
          }}>
            <DraftCard
              transcript={transcript}
              onReset={handleReset}
            />
          </section>
        )}
      </div>
    </main>
  );
}