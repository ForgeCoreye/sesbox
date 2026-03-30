"use client";

import React, { useMemo, useState } from "react";

type DraftCardProps = {
  draft: {
    id: string;
    title?: string | null;
    content?: string | null;
    updatedAt?: string | Date | null;
  };
  className?: string;
};

type ExportFormat = "json" | "markdown";

type ExportResponse = {
  format?: ExportFormat;
  content?: string;
  filename?: string;
  message?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong while exporting the draft.";
}

function getDefaultFilename(title: string | undefined | null, format: ExportFormat) {
  const safeTitle =
    (title || "draft")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "draft";
  return `${safeTitle}.${format === "markdown" ? "md" : "json"}`;
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function showToast(message: string, type: "success" | "error" = "success") {
  if (typeof window === "undefined") return;

  const event = new CustomEvent("toast", {
    detail: { message, type },
  });
  window.dispatchEvent(event);
}

async function exportDraft(draftId: string, format: ExportFormat): Promise<ExportResponse> {
  const response = await fetch(`/api/drafts/${encodeURIComponent(draftId)}/export?format=${encodeURIComponent(format)}`, {
    method: "GET",
    headers: {
      Accept: format === "markdown" ? "text/markdown, text/plain;q=0.9, */*;q=0.8" : "application/json, text/plain;q=0.9, */*;q=0.8",
    },
  });

  if (!response.ok) {
    let message = `Export failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string; message?: string };
      message = data.error || data.message || message;
    } catch {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as ExportResponse;
  }

  const content = await response.text();
  return { content };
}

export default function DraftCard({ draft, className }: DraftCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("markdown");

  const updatedLabel = useMemo(() => {
    if (!draft.updatedAt) return null;
    const date = draft.updatedAt instanceof Date ? draft.updatedAt : new Date(draft.updatedAt);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  }, [draft.updatedAt]);

  const handleExport = async () => {
    if (!draft.id || isExporting) return;

    setIsExporting(true);
    try {
      const result = await exportDraft(draft.id, selectedFormat);
      const content = result.content ?? "";
      const filename = result.filename || getDefaultFilename(draft.title, selectedFormat);

      if (!content) {
        throw new Error("Export completed, but no content was returned.");
      }

      if (selectedFormat === "json") {
        try {
          const parsed = JSON.parse(content);
          const pretty = JSON.stringify(parsed, null, 2);
          triggerDownload(filename, pretty, "application/json;charset=utf-8");
        } catch {
          triggerDownload(filename, content, "application/json;charset=utf-8");
        }
      } else {
        triggerDownload(filename, content, "text/markdown;charset=utf-8");
      }

      try {
        await copyToClipboard(content);
      } catch {
        // Clipboard is best-effort; download already succeeded.
      }

      showToast(`Exported draft as ${selectedFormat.toUpperCase()}.`, "success");
    } catch (error) {
      const message = getErrorMessage(error);
      showToast(message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-slate-900">{draft.title || "Untitled draft"}</h3>
          {updatedLabel ? <p className="mt-1 text-sm text-slate-500">Updated {updatedLabel}</p> : null}
        </div>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`export-format-${draft.id}`}>
            Export format
          </label>
          <select
            id={`export-format-${draft.id}`}
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
            disabled={isExporting}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isExporting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                />
                Exporting...
              </>
            ) : (
              "Export"
            )}
          </button>
        </div>
      </div>

      {draft.content ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{draft.content}</p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">No content yet.</p>
      )}
    </div>
  );
}