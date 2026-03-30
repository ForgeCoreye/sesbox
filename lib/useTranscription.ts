"use client";

import { useCallback, useState } from "react";

export type TranscriptionStatus = "idle" | "loading" | "success" | "error";

export interface TranscriptionResult {
  transcript: string;
  title: string;
}

export interface UseTranscriptionState {
  status: TranscriptionStatus;
  loading: boolean;
  error: string | null;
  transcript: string;
  title: string;
  data: TranscriptionResult | null;
  transcribeAudio: (audioBlob: Blob) => Promise<TranscriptionResult | null>;
  reset: () => void;
}

const DEFAULT_TRANSCRIPTION_ENDPOINT = "/api/transcription";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Failed to transcribe audio. Please try again.";
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function extractTranscriptionResult(body: unknown): TranscriptionResult {
  if (body && typeof body === "object") {
    const maybeBody = body as Record<string, unknown>;
    const transcript =
      typeof maybeBody.transcript === "string" ? maybeBody.transcript : "";
    const title = typeof maybeBody.title === "string" ? maybeBody.title : "";

    if (transcript.trim() || title.trim()) {
      return {
        transcript: transcript.trim(),
        title: title.trim(),
      };
    }
  }

  throw new Error("Invalid transcription response received from server.");
}

export function useTranscription(): UseTranscriptionState {
  const [status, setStatus] = useState<TranscriptionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TranscriptionResult | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setData(null);
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    if (!(audioBlob instanceof Blob)) {
      const message = "A valid audio blob is required for transcription.";
      setStatus("error");
      setError(message);
      setData(null);
      return null;
    }

    setStatus("loading");
    setError(null);
    setData(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const response = await fetch(DEFAULT_TRANSCRIPTION_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      const body = await parseResponseBody(response);

      if (!response.ok) {
        const message =
          body && typeof body === "object" && "error" in body
            ? String((body as Record<string, unknown>).error ?? "")
            : response.statusText || "Transcription request failed.";
        throw new Error(message);
      }

      const result = extractTranscriptionResult(body);

      setStatus("success");
      setData(result);
      return result;
    } catch (err) {
      const message = getErrorMessage(err);
      setStatus("error");
      setError(message);
      setData(null);
      return null;
    }
  }, []);

  return {
    status,
    loading: status === "loading",
    error,
    transcript: data?.transcript ?? "",
    title: data?.title ?? "",
    data,
    transcribeAudio,
    reset,
  };
}