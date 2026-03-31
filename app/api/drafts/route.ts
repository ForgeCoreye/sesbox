import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { drafts } from '../../../lib/transcribe';

type DraftInput = {
  transcript?: unknown;
  title?: unknown;
};

type Draft = {
  id: string;
  transcript: string;
  title: string;
  createdAt: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toDraftArray(): Draft[] {
  return Array.from(drafts.values()) as Draft[];
}

export async function GET() {
  try {
    return NextResponse.json(toDraftArray(), { status: 200 });
  } catch (error) {
    console.error("Failed to list drafts:", error);
    return NextResponse.json(
      { error: "Failed to list drafts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as DraftInput;

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { transcript, title } = body;

    if (!isNonEmptyString(transcript) || !isNonEmptyString(title)) {
      return NextResponse.json(
        { error: "transcript and title are required" },
        { status: 400 }
      );
    }

    const draft: Draft = {
      id: randomUUID(),
      transcript: transcript.trim(),
      title: title.trim(),
      createdAt: new Date().toISOString(),
    };

    drafts.set(draft.id, draft);

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    console.error("Failed to create draft:", error);
    return NextResponse.json(
      { error: "Failed to create draft" },
      { status: 500 }
    );
  }
}