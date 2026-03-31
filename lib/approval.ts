export type ApprovalStatus = "pending" | "approved" | "rejected";

const APPROVAL_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "approved",
  "rejected",
]);

export function validateApprovalStatus(status: string): ApprovalStatus {
  if (typeof status !== "string") {
    throw new TypeError("Approval status must be a string.");
  }

  const normalized = status.trim().toLowerCase();

  if (!APPROVAL_STATUSES.has(normalized)) {
    throw new Error(
      `Invalid approval status: "${status}". Expected one of: pending, approved, rejected.`
    );
  }

  return normalized as ApprovalStatus;
}

export function formatApprovalMessage(status: string): string {
  const normalized = validateApprovalStatus(status);

  switch (normalized) {
    case "pending":
      return "Draft is pending review.";
    case "approved":
      return "Draft approved successfully.";
    case "rejected":
      return "Draft rejected.";
    default: {
      const exhaustiveCheck: never = normalized;
      return exhaustiveCheck;
    }
  }
}