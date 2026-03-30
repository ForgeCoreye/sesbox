"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type RecorderStatus = "ready" | "recording" | "exported";

type VoiceRecorderProps = {
  onError?: (...args: any[]) => void
  onSuccess?: (...args: any[]) => void
  onExport?: (audioBlob: Blob) => Promise<void> | void;
  className?: string;
};

function formatDuration(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getStatusLabel(status: RecorderStatus): string {
  switch (status) {
    case "recording":
      return "Recording...";
    case "exported":
      return "Exported";
    case "ready":
    default:
      return "Ready to record";
  }
}

export default function VoiceRecorder({ onExport, className }: VoiceRecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>("ready");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const canRecord = status !== "recording";
  const canStop = status === "recording";
  const hasRecording = Boolean(audioUrl && audioBlob);

  const statusLabel = useMemo(() => getStatusLabel(status), [status]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [audioUrl]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const resetRecording = () => {
    clearTimer();
    stopStream();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setElapsedSeconds(0);
    setError(null);
    setStatus("ready");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setIsExporting(false);
  };

  const startRecording = async () => {
    setError(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Recording failed. Please try again.");
        resetRecording();
      };

      recorder.onstop = () => {
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          setAudioBlob(blob);
          setAudioUrl(url);
          setStatus("exported");
        } catch {
          setError("Could not prepare the recording preview.");
          setStatus("ready");
        } finally {
          clearTimer();
          stopStream();
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setElapsedSeconds(0);
      setStatus("recording");

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to access microphone.";
      setError(message);
      resetRecording();
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      setError("Could not stop recording cleanly.");
      resetRecording();
    }
  };

  const handleExport = async () => {
    if (!audioBlob) return;

    setIsExporting(true);
    setError(null);

    try {
      await onExport?.(audioBlob);
      setStatus("exported");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed.";
      setError(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={className ?? "w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">Voice Recorder</p>
          <p className="text-xs text-slate-500">{statusLabel}</p>
        </div>

        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums text-slate-700">
          {status === "recording" ? formatDuration(elapsedSeconds) : "00:00"}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            disabled={!canRecord}
            className="flex min-h-14 flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            aria-label="Start recording"
          >
            ● Record
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!canStop}
            className="flex min-h-14 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            aria-label="Stop recording"
          >
            ■ Stop
          </button>
        </div>

        {hasRecording ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Preview</p>
                <p className="text-xs text-slate-500">Listen back before exporting.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Ready to export
              </span>
            </div>

            <audio controls src={audioUrl ?? undefined} className="w-full" />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={resetRecording}
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Retry
              </button>

              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              >
                {isExporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Tap <span className="font-semibold text-slate-900">Record</span> to begin. Your audio preview will appear here after you stop.
          </div>
        )}
      </div>
    </div>
  );
}
export { VoiceRecorder }
