"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranscription } from '../hooks/useTranscription';
import { ApprovalCard } from './ApprovalCard';

type RecordingState = "idle" | "recording" | "stopped" | "transcribing" | "error";

type VoiceRecorderProps = {
  onSuccess?: (...args: any[]) => void
  onApproved?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
};

function getMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return "audio/webm";
}

function createAudioUrl(blob: Blob | null): string | null {
  if (!blob) return null;
  try {
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export default function VoiceRecorder({ onApproved, onError }: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  const audioUrl = useMemo(() => createAudioUrl(audioBlob), [audioBlob]);

  const transcription = useTranscription({
    audioBlob,
    enabled: Boolean(audioBlob) && state === "stopped",
  });

  useEffect(() => {
    if (transcription.isLoading) {
      setState("transcribing");
      return;
    }

    if (transcription.error) {
      setState("error");
      const err = transcription.error instanceof Error ? transcription.error : new Error("Transcription failed");
      setLocalError(err.message);
      onError?.(err);
      return;
    }

    if (transcription.data && state === "transcribing") {
      setState("idle");
    }
  }, [transcription.isLoading, transcription.error, transcription.data, state, onError]);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setLocalError(null);

    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("Audio recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: getMimeType() });

      const nextChunks: BlobPart[] = [];
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) nextChunks.push(event.data);
      };

      recorder.onstop = () => {
        try {
          const blob = new Blob(nextChunks, { type: recorder.mimeType || "audio/webm" });
          setChunks([]);
          setAudioBlob(blob);
          setState("stopped");
        } catch (err) {
          const error = err instanceof Error ? err : new Error("Failed to finalize recording.");
          setState("error");
          setLocalError(error.message);
          onError?.(error);
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      setChunks(nextChunks);
      setMediaRecorder(recorder);
      setAudioBlob(null);
      setState("recording");
      recorder.start();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to start recording.");
      setState("error");
      setLocalError(error.message);
      onError?.(error);
    }
  };

  const stopRecording = () => {
    try {
      if (!mediaRecorder || mediaRecorder.state !== "recording") return;
      mediaRecorder.stop();
      setMediaRecorder(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to stop recording.");
      setState("error");
      setLocalError(error.message);
      onError?.(error);
    }
  };

  const handleApprove = () => {
    if (!transcription.data || !audioBlob) return;
    onApproved?.({
      transcript: transcription.data.transcript,
      title: transcription.data.title,
      audioBlob,
    });
  };

  const transcript = transcription.data?.transcript ?? "";
  const title = transcription.data?.title ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {state !== "recording" ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={transcription.isLoading}
          >
            Start recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-md bg-red-600 px-4 py-2 text-white"
          >
            Stop recording
          </button>
        )}

        {state === "transcribing" && (
          <span className="text-sm text-gray-600">Transcribing audio…</span>
        )}
      </div>

      {localError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {localError}
        </div>
      )}

      {audioBlob && audioUrl && (
        <div className="rounded-md border border-gray-200 p-3">
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {transcription.isLoading && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          Processing your recording…
        </div>
      )}

      {transcription.data && !transcription.isLoading && (
        <ApprovalCard
          transcript={transcript}
          title={title}
          onApprove={handleApprove}
          onEdit={(next) => {
            transcription.setDraft?.(next);
          }}
        />
      )}
    </div>
  );
}
export { VoiceRecorder }
