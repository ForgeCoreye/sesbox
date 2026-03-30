"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type RecordingTimerProps = {
  isRecording: boolean;
  startedAt?: number | null;
  className?: string;
  label?: string;
};

function formatElapsedTime(elapsedMs: number): string {
  const safeMs = Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${mm}:${ss}`;
}

export default function RecordingTimer({
  isRecording,
  startedAt,
  className,
  label = "Recording",
}: RecordingTimerProps) {
  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isRecording) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setNow(Date.now());
      return;
    }

    setNow(Date.now());

    intervalRef.current = window.setInterval(() => {
      try {
        setNow(Date.now());
      } catch (error) {
        console.error("RecordingTimer: failed to update elapsed time", error);
      }
    }, 100);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRecording]);

  const elapsedMs = useMemo(() => {
    if (!isRecording) return 0;

    const start = typeof startedAt === "number" && Number.isFinite(startedAt) ? startedAt : now;
    return Math.max(0, now - start);
  }, [isRecording, startedAt, now]);

  const displayTime = formatElapsedTime(elapsedMs);

  return (
    <div
      className={className}
      aria-live="polite"
      aria-atomic="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "1rem",
        lineHeight: 1.4,
        fontVariantNumeric: "tabular-nums",
        color: isRecording ? "inherit" : "rgba(0, 0, 0, 0.65)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "3.5rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "9999px",
          background: isRecording ? "rgba(239, 68, 68, 0.12)" : "rgba(0, 0, 0, 0.06)",
          color: isRecording ? "rgb(185, 28, 28)" : "inherit",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        {displayTime}
      </span>
      <span style={{ fontSize: "0.95rem", fontWeight: 500 }}>{isRecording ? `${label}...` : "Ready"}</span>
    </div>
  );
}