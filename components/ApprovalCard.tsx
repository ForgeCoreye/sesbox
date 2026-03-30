import React from "react";

export type Draft = {
  id: string;
  transcription: string;
  title: string;
  createdAt: string | Date;
};

export type ApprovalCardProps = {
  draft: Draft;
  onApprove: (draft: Draft) => void;
  onReject: (draft: Draft) => void;
  onEdit: (draft: Draft) => void;
  className?: string;
};

function formatCreatedAt(createdAt: string | Date): string {
  try {
    const date = createdAt instanceof Date ? createdAt : new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "Unknown date";
  }
}

function safeText(value: unknown, fallback = "Untitled"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function safeContent(value: unknown, fallback = "No transcription available."): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export default function ApprovalCard({
  draft,
  onApprove,
  onReject,
  onEdit,
  className,
}: ApprovalCardProps) {
  const title = safeText(draft?.title);
  const transcription = safeContent(draft?.transcription);
  const createdAt = formatCreatedAt(draft?.createdAt);

  const handleAction =
    (action: (draft: Draft) => void) =>
    () => {
      try {
        if (!draft || typeof draft.id !== "string" || draft.id.trim().length === 0) {
          throw new Error("Invalid draft payload.");
        }
        action(draft);
      } catch (error) {
        console.error("ApprovalCard action failed:", error);
      }
    };

  return (
    <section
      className={className}
      aria-labelledby={`draft-title-${draft.id}`}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#ffffff",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        display: "grid",
        gap: 12,
      }}
    >
      <header style={{ display: "grid", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div style={{ minWidth: 0 }}>
            <h3
              id={`draft-title-${draft.id}`}
              style={{
                margin: 0,
                fontSize: 18,
                lineHeight: 1.3,
                fontWeight: 700,
                color: "#111827",
                wordBreak: "break-word",
              }}
            >
              {title}
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              Draft ID: {safeText(draft?.id, "unknown")}
            </p>
          </div>
          <time dateTime={new Date(draft.createdAt).toISOString()} style={{ fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>
            {createdAt}
          </time>
        </div>
      </header>

      <div style={{ display: "grid", gap: 8 }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#374151" }}>Transcription</h4>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 12,
            background: "#f9fafb",
            color: "#111827",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            lineHeight: 1.6,
            fontSize: 14,
          }}
        >
          {transcription}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          onClick={handleAction(onEdit)}
          aria-label="Edit draft"
          style={{
            appearance: "none",
            border: "1px solid #d1d5db",
            background: "#ffffff",
            color: "#111827",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Edit
        </button>

        <button
          type="button"
          onClick={handleAction(onReject)}
          aria-label="Reject draft"
          style={{
            appearance: "none",
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#b91c1c",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reject
        </button>

        <button
          type="button"
          onClick={handleAction(onApprove)}
          aria-label="Approve draft"
          style={{
            appearance: "none",
            border: "1px solid #86efac",
            background: "#dcfce7",
            color: "#166534",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Approve
        </button>
      </div>
    </section>
  );
}
export { ApprovalCard }
