import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

type TranscribeSuccessResponse = {
  transcript: string;
  filename?: string;
  mimeType?: string;
  durationMs: number;
};

type ErrorResponse = {
  error: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json<ErrorResponse>({ error: message }, { status });
}

function isAudioFile(file: File): boolean {
  return typeof file.type === "string" && file.type.startsWith("audio/");
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonError("Unauthorized", 401);
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return jsonError("Content-Type must be multipart/form-data", 400);
    }

    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return jsonError('Missing required "audio" file field', 400);
    }

    if (audio.size <= 0) {
      return jsonError("Uploaded audio file is empty", 400);
    }

    if (!isAudioFile(audio)) {
      return jsonError("Invalid file type. Expected an audio file.", 400);
    }

    const startedAt = Date.now();

    const transcript = `Mock transcript for ${audio.name || "uploaded audio"} (${audio.type || "unknown type"})`;

    const response: TranscribeSuccessResponse = {
      transcript,
      filename: audio.name || undefined,
      mimeType: audio.type || undefined,
      durationMs: Date.now() - startedAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Transcribe API error:", error);
    return jsonError("Internal server error", 500);
  }
}