"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RecordingState = "idle" | "recording" | "uploading";

type RecordingComponentProps = {
  onUpload?: (blob: Blob) => Promise<void> | void;
  className?: string;
};

const MAX_DURATION_SECONDS = 60 * 10;

export default function RecordingComponent({
  onUpload,
  className,
}: RecordingComponentProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const durationTimerRef = useRef<number | null>(null);

  const isRecording = state === "recording";
  const isUploading = state === "uploading";

  const clearTimers = useCallback(() => {
    if (durationTimerRef.current !== null) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const cleanupAudioGraph = useCallback(() => {
    try {
      sourceRef.current?.disconnect();
    } catch {}
    try {
      analyserRef.current?.disconnect();
    } catch {}

    sourceRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close().catch(() => undefined);
    }
    audioContextRef.current = null;
  }, []);

  const stopMediaTracks = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
    mediaStreamRef.current = null;
  }, []);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = isRecording ? "#22c55e" : "#60a5fa";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i += 1) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    render();
  }, [isRecording]);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    return new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        resolve(blob);
      };

      try {
        recorder.stop();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to stop recording.");
        resolve(null);
      }
    });
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    if (typeof window === "undefined") {
      setError("Recording is only available in the browser.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Your browser does not support audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error("Web Audio API is not supported in this browser.");
      }

      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      source.connect(analyser);
      sourceRef.current = source;
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("Recording failed unexpectedly.");
        setState("idle");
        clearTimers();
        stopMediaTracks();
        cleanupAudioGraph();
        resetCanvas();
      };

      recorder.start();
      setState("recording");
      setDuration(0);
      startTimeRef.current = Date.now();

      durationTimerRef.current = window.setInterval(() => {
        if (startTimeRef.current === null) return;
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(Math.min(elapsed, MAX_DURATION_SECONDS));

        if (elapsed >= MAX_DURATION_SECONDS) {
          void handleStop();
        }
      }, 250);

      drawWaveform();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start recording.";
      setError(message);
      setState("idle");
      clearTimers();
      stopMediaTracks();
      cleanupAudioGraph();
      resetCanvas();
    }
  }, [clearTimers, cleanupAudioGraph, drawWaveform, resetCanvas, stopMediaTracks]);

  const handleStop = useCallback(async () => {
    if (isUploading) return;

    setError(null);
    setState("uploading");
    clearTimers();

    try {
      const blob = await stopRecording();
      stopMediaTracks();
      cleanupAudioGraph();
      resetCanvas();
      setDuration((prev) => prev);

      if (!blob) {
        setState("idle");
        return;
      }

      if (onUpload) {
        await onUpload(blob);
      }

      setState("idle");
      startTimeRef.current = null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize recording.");
      setState("idle");
    } finally {
      stopMediaTracks();
      cleanupAudioGraph();
      resetCanvas();
    }
  }, [clearTimers, cleanupAudioGraph, isUploading, onUpload, resetCanvas, stopMediaTracks, stopRecording]);

  const handleStartStop = useCallback(() => {
    if (isRecording) {
      void handleStop();
      return;
    }
    if (isUploading) return;
    void startRecording();
  }, [handleStop, isRecording, isUploading, startRecording]);

  useEffect(() => {
    resetCanvas();
    return () => {
      clearTimers();
      stopMediaTracks();
      cleanupAudioGraph();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
    };
  }, [clearTimers, cleanupAudioGraph, resetCanvas, stopMediaTracks]);

  const statusLabel = useMemo(() => {
    switch (state) {
      case "recording":
        return "Recording";
      case "uploading":
        return "Uploading";
      default:
        return "Ready";
    }
  }, [state]);

  const buttonLabel = isRecording ? "Stop recording" : isUploading ? "Uploading..." : "Start recording";

  return (
    <div className={className ?? "w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{statusLabel}</p>
          <p className="text-xs text-slate-500">
            Duration: <span className="font-mono">{duration}s</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartStop}
            disabled={isUploading}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isRecording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {buttonLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isRecording) {
                void handleStop();
              } else {
                setError(null);
                setDuration(0);
                resetCanvas();
              }
            }}
            disabled={isUploading}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRecording ? "Stop" : "Reset"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={900}
          height={180}
          className="block h-44 w-full"
          aria-label="Audio waveform visualization"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className={`text-sm ${isRecording ? "text-green-600" : isUploading ? "text-blue-600" : "text-slate-500"}`}>
          {isRecording
            ? "Listening for your voice..."
            : isUploading
              ? "Finalizing your recording..."
              : "Press start to begin recording."}
        </p>

        <p className="text-xs text-slate-400">Web Audio API</p>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}