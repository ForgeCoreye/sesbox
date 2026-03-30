"use client";

import { useCallback, useState } from "react";
import { VoiceUploader } from '../../components/voice-uploader';
import { DraftCard } from '../../components/draft-card';

export default function DashboardPage() {
  const [transcript, setTranscript] = useState<string>("");
  const [draftKey, setDraftKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleTranscriptReady = useCallback((nextTranscript: string) => {
    try {
      const normalized = typeof nextTranscript === "string" ? nextTranscript.trim() : "";
      if (!normalized) {
        setError("No transcript was returned. Please try again.");
        setTranscript("");
        return;
      }

      setError(null);
      setTranscript(normalized);
    } catch (err) {
      console.error("Failed to handle transcript:", err);
      setError("Something went wrong while loading the transcript.");
      setTranscript("");
    }
  }, []);

  const handleResetForNextUpload = useCallback(() => {
    setTranscript("");
    setError(null);
    setDraftKey((current) => current + 1);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Record a voice note, review the transcript, and prepare a draft for export.
        </p>
      </section>

      <section className="rounded-lg border bg-background p-4">
        <VoiceUploader
          key={draftKey}
          onTranscriptReady={handleTranscriptReady}
          onReset={handleResetForNextUpload}
        />
      </section>

      {error ? (
        <section
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </section>
      ) : null}

      {transcript ? (
        <section className="rounded-lg border bg-background p-4">
          <DraftCard
            transcript={transcript}
            onReset={handleResetForNextUpload}
          />
        </section>
      ) : null}
    </main>
  );
}