import React, { useEffect, useMemo, useState } from "react";

type ApprovalCardProps = {
  onEdit?: (...args: any[]) => void
  onApprove?: (...args: any[]) => void
  transcript?: string;
  title?: string;
  onExport?: (payload: { title: string; transcript: string }) => void;
  className?: string;
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export default function ApprovalCard({
  transcript = "",
  title = "",
  onExport,
  className,
}: ApprovalCardProps) {
  const initialTranscript = useMemo(() => normalizeText(transcript), [transcript]);
  const initialTitle = useMemo(() => normalizeText(title), [title]);

  const [editedTitle, setEditedTitle] = useState(initialTitle);
  const [editedTranscript, setEditedTranscript] = useState(initialTranscript);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  useEffect(() => {
    setEditedTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setEditedTranscript(initialTranscript);
  }, [initialTranscript]);

  const canExport = editedTitle.length > 0 && editedTranscript.length > 0;

  const handleExport = () => {
    try {
      setError(null);

      const payload = {
        title: editedTitle.trim(),
        transcript: editedTranscript.trim(),
      };

      if (!payload.title || !payload.transcript) {
        throw new Error("Title and transcript are required before export.");
      }

      if (onExport) {
        onExport(payload);
      } else if (typeof window !== "undefined") {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "approval-export.json";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      }

      setExported(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export content.";
      setError(message);
      setExported(false);
    }
  };

  return (
    <div className={className ?? "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Approval</h2>
        <p className="text-sm text-slate-500">
          Review, edit, and export the generated draft before publishing.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Enter a title"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Transcript</span>
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            placeholder="Transcript will appear here"
            rows={10}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {exported ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Content exported successfully.
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Export
          </button>
          <span className="text-xs text-slate-500">
            Export returns the edited title and transcript.
          </span>
        </div>
      </div>
    </div>
  );
}
export { ApprovalCard }
