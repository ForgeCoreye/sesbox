"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type WaveformCanvasProps = {
  samples?: number[];
  isRecording?: boolean;
  className?: string;
  height?: number;
  barColor?: string;
  activeBarColor?: string;
  backgroundColor?: string;
  fallbackText?: string;
  ariaLabel?: string;
};

const DEFAULT_HEIGHT = 96;
const DEFAULT_FALLBACK_TEXT = "Waveform visualization";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeSamples(samples: number[]): number[] {
  if (!samples.length) return [];

  let maxAbs = 0;
  for (const sample of samples) {
    const abs = Math.abs(sample);
    if (Number.isFinite(abs) && abs > maxAbs) maxAbs = abs;
  }

  if (maxAbs <= 0) {
    return samples.map(() => 0);
  }

  return samples.map((sample) => {
    const value = Number.isFinite(sample) ? sample / maxAbs : 0;
    return clamp(value, -1, 1);
  });
}

function buildFallbackWaveform(length = 48): number[] {
  const values: number[] = [];
  for (let i = 0; i < length; i += 1) {
    const t = i / Math.max(1, length - 1);
    const base = Math.sin(t * Math.PI * 2) * 0.35;
    const detail = Math.sin(t * Math.PI * 8) * 0.15;
    values.push(clamp(base + detail, -1, 1));
  }
  return values;
}

function getCanvasSize(canvas: HTMLCanvasElement, fallbackHeight: number) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width || canvas.clientWidth || 0));
  const height = Math.max(1, Math.floor(rect.height || fallbackHeight));
  return { width, height };
}

function drawWaveform(
  canvas: HTMLCanvasElement,
  samples: number[],
  isRecording: boolean,
  barColor: string,
  activeBarColor: string,
  backgroundColor: string,
  fallbackHeight: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = getCanvasSize(canvas, fallbackHeight);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const displayWidth = Math.max(1, Math.floor(width * dpr));
  const displayHeight = Math.max(1, Math.floor(height * dpr));

  if (canvas.width !== displayWidth) canvas.width = displayWidth;
  if (canvas.height !== displayHeight) canvas.height = displayHeight;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const normalized = normalizeSamples(samples.length ? samples : buildFallbackWaveform());
  const barCount = Math.max(12, Math.min(120, normalized.length));
  const step = normalized.length / barCount;
  const centerY = height / 2;
  const maxBarHeight = Math.max(8, height * 0.42);
  const minBarHeight = Math.max(2, height * 0.08);
  const gap = Math.max(1, Math.floor(width / barCount / 5));
  const barWidth = Math.max(1, Math.floor((width - gap * (barCount - 1)) / barCount));

  for (let i = 0; i < barCount; i += 1) {
    const sampleIndex = Math.min(normalized.length - 1, Math.floor(i * step));
    const raw = normalized[sampleIndex] ?? 0;
    const amplitude = Math.abs(raw);
    const animatedBoost = isRecording ? 0.12 * Math.sin((Date.now() / 120) + i * 0.35) : 0;
    const scaled = clamp(amplitude + animatedBoost, 0, 1);
    const barHeight = Math.max(minBarHeight, scaled * maxBarHeight);

    const x = i * (barWidth + gap);
    const y = centerY - barHeight / 2;

    ctx.fillStyle = isRecording ? activeBarColor : barColor;
    ctx.globalAlpha = isRecording ? 0.95 : 0.75;
    ctx.beginPath();
    const radius = Math.min(4, barWidth / 2);
    ctx.roundRect(x, y, barWidth, barHeight, radius);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

export default function WaveformCanvas({
  samples = [],
  isRecording = false,
  className,
  height = DEFAULT_HEIGHT,
  barColor = "rgba(148, 163, 184, 0.75)",
  activeBarColor = "rgba(59, 130, 246, 0.95)",
  backgroundColor = "transparent",
  fallbackText = DEFAULT_FALLBACK_TEXT,
  ariaLabel = "Audio waveform visualization",
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [hasCanvasSupport, setHasCanvasSupport] = useState(true);

  const safeSamples = useMemo(() => {
    if (!Array.isArray(samples)) return [];
    return samples.filter((value) => Number.isFinite(value));
  }, [samples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = () => {
      try {
        drawWaveform(
          canvas,
          safeSamples,
          isRecording,
          barColor,
          activeBarColor,
          backgroundColor,
          height
        );
        setHasCanvasSupport(true);
      } catch {
        setHasCanvasSupport(false);
      }
      frameRef.current = window.requestAnimationFrame(render);
    };

    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [safeSamples, isRecording, barColor, activeBarColor, backgroundColor, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;

    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = new ResizeObserver(() => {
      try {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const { width, height: canvasHeight } = getCanvasSize(canvas, height);
        canvas.width = Math.max(1, Math.floor(width * (window.devicePixelRatio || 1)));
        canvas.height = Math.max(1, Math.floor(canvasHeight * (window.devicePixelRatio || 1)));
      } catch {
        setHasCanvasSupport(false);
      }
    });

    resizeObserverRef.current.observe(canvas);

    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [height]);

  return (
    <div className={className} style={{ width: "100%" }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={ariaLabel}
        aria-hidden={!hasCanvasSupport}
        style={{
          display: "block",
          width: "100%",
          height,
          borderRadius: 12,
        }}
      />
      {!hasCanvasSupport ? (
        <div
          aria-live="polite"
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "rgb(100 116 139)",
          }}
        >
          {fallbackText}
        </div>
      ) : null}
    </div>
  );
}