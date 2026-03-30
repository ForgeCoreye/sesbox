import React, { useEffect, useMemo, useState } from "react";

type DraftCardProps = {
  transcript: string;
  onChange?: (value: string) => void;
  className?: string;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

function safeCopyToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined") {
    return Promise.reject(new Error("Clipboard is not available in this environment."));
  }

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve, reject) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (successful) resolve();
      else reject(new Error("Copy command was not successful."));
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Failed to copy text."));
    }
  });
}

export default function DraftCard({
  transcript,
  onChange,
  className,
}: DraftCardProps) {
  const initialValue = useMemo(() => transcript ?? "", [transcript]);
  const [draft, setDraft] = useState<string>(initialValue);
  const [savedValue, setSavedValue] = useState<string>(initialValue);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const nextValue = transcript ?? "";
    setDraft(nextValue);
    setSavedValue(nextValue);
  }, [transcript]);

  const isDirty = draft !== savedValue;
  const wordCount = useMemo(() => getWordCount(draft), [draft]);

  const handleCopy = async () => {
    try {
      await safeCopyToClipboard(draft);
      setCopyState("copied");
      setCopyMessage("Copied to clipboard");
      window.setTimeout(() => {
        setCopyState("idle");
        setCopyMessage("");
      }, 1800);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to copy transcript.";
      setCopyState("error");
      setCopyMessage(message);
      window.setTimeout(() => {
        setCopyState("idle");
        setCopyMessage("");
      }, 2500);
    }
  };

  const handleExportStub = (format: "markdown" | "pdf") => {
    const message =
      format === "markdown"
        ? "Markdown export coming soon."
        : "PDF export coming soon.";
    setCopyState("error");
    setCopyMessage(message);
    window.setTimeout(() => {
      setCopyState("idle");
      setCopyMessage("");
    }, 2200);
  };

  const handleSave = () => {
    setSavedValue(draft);
    onChange?.(draft);
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      )}
      aria-label="Draft review card"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Draft</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review, edit, and prepare your transcript for export.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-sm text-slate-600">
            <span className="font-medium text-slate-900">{wordCount}</span>{" "}
            {wordCount === 1 ? "word" : "words"}
          </div>
          <div
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              isDirty
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            )}
            aria-live="polite"
          >
            {isDirty ? "Unsaved changes" : "Saved"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <label
          htmlFor="draft-transcript"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Transcript
        </label>
        <textarea
          id="draft-transcript"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onFocus={() => setIsFocused(true)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
              e.preventDefault();
              handleSave();
            }
          }}
          rows={12}
          className={cn(
            "w-full rounded-xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition",
            "placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200",
            isFocused ? "border-slate-300" : "border-slate-200"
          )}
          placeholder="Your transcript will appear here..."
        />
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {isDirty
              ? "Changes are not yet saved."
              : "No unsaved changes."}
          </span>
          <span>Tip: press Ctrl/Cmd + S to save.</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          Copy transcript
        </button>

        <button
          type="button"
          disabled
          onClick={() => handleExportStub("markdown")}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
          aria-disabled="true"
          title="Markdown export coming soon"
        >
          Export Markdown
        </button>

        <button
          type="button"
          disabled
          onClick={() => handleExportStub("pdf")}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
          aria-disabled="true"
          title="PDF export coming soon"
        >
          Export PDF
        </button>

        {copyMessage ? (
          <span
            className={cn(
              "text-sm",
              copyState === "error" ? "text-rose-600" : "text-emerald-600"
            )}
            role="status"
            aria-live="polite"
          >
            {copyMessage}
          </span>
        ) : null}
      </div>
    </section>
  );
}