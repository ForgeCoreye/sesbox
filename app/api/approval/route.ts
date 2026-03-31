import { NextResponse } from "next/server";

type ApprovalStatus = "approved" | "rejected" | "edit";

type ApprovalRequestBody = {
  draftId?: unknown;
  status?: unknown;
};

type ApprovalResponse = {
  success: boolean;
  status: ApprovalStatus;
  message: string;
};

const ALLOWED_STATUSES = new Set<ApprovalStatus>(["approved", "rejected", "edit"]);

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === "string" && ALLOWED_STATUSES.has(value as ApprovalStatus);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildResponse(
  success: boolean,
  status: ApprovalStatus,
  message: string,
  init?: ResponseInit
) {
  const body: ApprovalResponse = { success, status, message };
  return NextResponse.json(body, init);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return buildResponse(false, "edit", "Invalid content type. Expected application/json.", {
        status: 400,
      });
    }

    let payload: ApprovalRequestBody;
    try {
      payload = (await request.json()) as ApprovalRequestBody;
    } catch {
      return buildResponse(false, "edit", "Invalid JSON payload.", { status: 400 });
    }

    const { draftId, status } = payload;

    if (!isNonEmptyString(draftId)) {
      return buildResponse(false, "edit", "draftId is required.", { status: 400 });
    }

    if (!isApprovalStatus(status)) {
      return buildResponse(false, "edit", "status must be one of: approved, rejected, edit.", {
        status: 400,
      });
    }

    return buildResponse(true, status, `Draft ${draftId.trim()} marked as ${status}.`, {
      status: 200,
    });
  } catch (error) {
    console.error("Approval API error:", error);
    return buildResponse(false, "edit", "An unexpected error occurred.", { status: 500 });
  }
}