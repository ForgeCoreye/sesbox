"use client";

import React, { useMemo, useState } from "react";

type ApprovalStatus = "pending" | "approved" | "rejected" | "edited";

type ApprovalAction = "accept" | "edit" | "reject";

type Draft = {
  headline: string;
  bullets: string[];
};

type ApprovalResponse = {
  ok?: boolean;
  status?: ApprovalStatus;
  message?: string;
};

type ApprovalLaneProps = {
  draft?: Draft;
  draftId?: string;
  initialStatus?: ApprovalStatus;
  className?: string;
  onStatusChange?: (status: ApprovalStatus) => void;
};

const DEFAULT_DRAFT: Draft = {
  headline: "Draft headline goes here",
  bullets: [
    "Bullet point one from the generated draft",
    "Bullet point two from the generated draft",
    "Bullet point three from the generated draft",
  ],
};

function statusLabel(status: ApprovalStatus): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "edited":
      return "Needs edits";
    case "pending":
    default:
      return "Pending review";
  }
}

function statusTone(status: ApprovalStatus): string {
  switch (status) {
    case "approved":
      return "bg-green-50 text-green-700 ring-green-200";
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-200";
    case "edited":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "pending":
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function actionToStatus(action: ApprovalAction): ApprovalStatus {
  switch (action) {
    case "accept":
      return "approved";
    case "edit":
      return "edited";
    case "reject":
      return "rejected";
    default:
      return "pending";
  }
}

async function submitApproval(input: {
  draftId?: string;
  action: ApprovalAction;
  status: ApprovalStatus;
  draft: Draft;
}): Promise<ApprovalResponse> {
  const response = await fetch("/api/approval", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      draftId: input.draftId,
      action: input.action,
      status: input.status,
      draft: input.draft,
    }),
  });

  const contentType = response.headers.get("content-type") || "";
  let payload: ApprovalResponse = {};

  if (contentType.includes("application/json")) {
    try {
      payload = (await response.json()) as ApprovalResponse;
    } catch {
      payload = {};
    }
  } else {
    try {
      const text = await response.text();
      payload = { message: text };
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const message =
      payload.message ||
      `Approval request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

export default function ApprovalLane({
  draft = DEFAULT_DRAFT,
  draftId,
  initialStatus = "pending",
  className = "",
  onStatusChange,
}: ApprovalLaneProps) {
  const [status, setStatus] = useState<ApprovalStatus>(initialStatus);
  const [loadingAction, setLoadingAction] = useState<ApprovalAction | null>(
    null
  );
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string>("");

  const isLoading = loadingAction !== null;

  const statusText = useMemo(() => statusLabel(status), [status]);

  const handleAction = async (action: ApprovalAction) => {
    setLoadingAction(action);
    setError("");
    setFeedback("");

    const nextStatus = actionToStatus(action);

    try {
      const result = await submitApproval({
        draftId,
        action,
        status: nextStatus,
        draft,
      });

      const resolvedStatus = result.status ?? nextStatus;
      setStatus(resolvedStatus);
      onStatusChange?.(resolvedStatus);

      setFeedback(
        result.message ||
          (action === "accept"
            ? "Draft approved successfully."
            : action === "edit"
              ? "Draft marked for edits."
              : "Draft rejected successfully.")
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      aria-label="Draft approval lane"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Draft review
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {draft.headline}
          </h2>
        </div>

        <div
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusTone(
            status
          )}`}
          aria-live="polite"
        >
          {statusText}
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-700">
        {draft.bullets.map((bullet, index) => (
          <li key={`${index}-${bullet}`} className="flex gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleAction("accept")}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "accept" ? "Saving..." : "Accept"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("edit")}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "edit" ? "Saving..." : "Edit"}
        </button>

        <button
          type="button"
          onClick={() => handleAction("reject")}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingAction === "reject" ? "Saving..." : "Reject"}
        </button>
      </div>

      <div className="mt-4 min-h-6" aria-live="polite">
        {feedback ? (
          <p className="text-sm text-emerald-700">{feedback}</p>
        ) : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {isLoading ? (
          <p className="text-sm text-slate-500">Submitting approval...</p>
        ) : null}
      </div>
    </section>
  );
}