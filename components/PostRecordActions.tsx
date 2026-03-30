"use client";

import React, { useMemo, useState } from "react";

type PostRecordActionsProps = {
  audioUrl?: string | null;
  fileName?: string;
  onExport?: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
  isExporting?: boolean;
  isRetrying?: boolean;
  className?: string;
};

function joinClassNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  busy = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  busy?: boolean;
  type?: "button" | "submit" | "reset";
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-black text-white hover:bg-neutral-800 focus:ring-black"
      : "bg-white text-neutral-900 ring-1 ring-inset ring-neutral-300 hover:bg-neutral-50 focus:ring-neutral-400";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      className={joinClassNames(base, styles)}
    >
      {busy ? "Working..." : children}
    </button>
  );
}

export default function PostRecordActions({
  audioUrl,
  fileName = "voice-note",
  onExport,
  onRetry,
  isExporting = false,
  isRetrying = false,
  className,
}: PostRecordActionsProps) {
  const [previewError, setPreviewError] = useState<string | null>(null);

  const hasAudio = Boolean(audioUrl);

  const statusText = useMemo(() => {
    if (!hasAudio) return "Ready to record";
    return "Ready to export";
  }, [hasAudio]);

  const handleExport = async () => {
    if (!onExport) return;
    try {
      await onExport();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    try {
      await onRetry();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  return (
    <section
      className={joinClassNames(
        "w-full rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
      aria-label="Post recording actions"
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-900">Recording complete</p>
          <p className="text-sm text-neutral-600">{statusText}</p>
        </div>

        <div className="inline-flex items-center self-start rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          Success
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          {hasAudio ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    Preview player
                  </p>
                  <p className="truncate text-xs text-neutral-500">{fileName}.mp3</p>
                </div>
              </div>

              <audio
                controls
                preload="metadata"
                className="w-full"
                src={audioUrl ?? undefined}
                onError={() => setPreviewError("Unable to load the audio preview.")}
              >
                Your browser does not support the audio element.
              </audio>

              {previewError ? (
                <p className="mt-2 text-sm text-red-600" role="alert">
                  {previewError}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
              <p className="text-sm font-medium text-neutral-900">No preview available</p>
              <p className="mt-1 text-sm text-neutral-600">
                Record audio to enable playback, export, and retry actions.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch">
          <ActionButton
            variant="primary"
            onClick={handleExport}
            disabled={!hasAudio || !onExport}
            busy={isExporting}
          >
            Export
          </ActionButton>

          <ActionButton
            variant="secondary"
            onClick={handleRetry}
            disabled={isExporting || !onRetry}
            busy={isRetrying}
          >
            Retry
          </ActionButton>
        </div>
      </div>
    </section>
  );
}