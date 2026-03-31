"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TranscriptionResult = {
  transcript: string;
  title: string;
};

type UseTranscriptionOptions = {
  audioBlob: Blob | null;
  enabled: boolean;
};

type UseTranscriptionReturn = {
  data: TranscriptionResult | null;
  isLoading: boolean;
  error: Error | null;
  setDraft?: (next: Partial<TranscriptionResult>) => void;
};

export function useTranscription({ audioBlob, enabled }: UseTranscriptionOptions): UseTranscriptionReturn {
  const [data, setData] = useState<TranscriptionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sentRef = useRef(false);

  const setDraft = useCallback((next: Partial<TranscriptionResult>) => {
    setData((prev) => (prev ? { ...prev, ...next } : null));
  }, []);

  useEffect(() => {
    if (!enabled || !audioBlob || sentRef.current) return;
    sentRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    async function run() {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob!, "recording.webm");

        const headers: Record<string, string> = {};
        const storedKey = typeof window !== "undefined"
          ? localStorage.getItem("sesbox_openai_key") ?? ""
          : "";
        if (storedKey) {
          headers["x-openai-key"] = storedKey;
        }

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || `Transcription failed (${response.status})`);
        }

        const result: TranscriptionResult = await response.json();
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setError(err instanceof Error ? err : new Error("Transcription failed"));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      controller.abort();
    };
  }, [enabled, audioBlob]);

  // Reset sentRef when audioBlob changes
  useEffect(() => {
    sentRef.current = false;
    setData(null);
    setError(null);
  }, [audioBlob]);

  return { data, isLoading, error, setDraft };
}
