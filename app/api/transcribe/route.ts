import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type TranscriptSegment = {
  id: string;
  start: number;
  end: number;
  text: string;
};

type TranscriptDraft = {
  id: string;
  createdAt: string;
  source: {
    filename: string;
    mimeType: string;
    size: number;
  };
  transcript: {
    text: string;
    language: string;
    confidence: number;
    segments: TranscriptSegment[];
  };
};

type DraftStore = {
  drafts: Map<string, TranscriptDraft>;
};

declare global {
  // eslint-disable-next-line no-var
  var __sesboxDraftStore: DraftStore | undefined;
}

function getDraftStore(): DraftStore {
  if (!globalThis.__sesboxDraftStore) {
    globalThis.__sesboxDraftStore = { drafts: new Map<string, TranscriptDraft>() };
  }
  return globalThis.__sesboxDraftStore;
}

function isValidAudioFile(file: File | null): file is File {
  if (!file) return false;
  if (typeof file.size !== "number" || file.size <= 0) return false;

  const mimeType = file.type?.toLowerCase() ?? "";
  const name = file.name?.toLowerCase() ?? "";

  const allowedMimeTypes = new Set([
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
    "application/octet-stream",
  ]);

  const allowedExtensions = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".webm", ".flac", ".mp4"];

  return allowedMimeTypes.has(mimeType) || allowedExtensions.some((ext) => name.endsWith(ext));
}

function buildMockTranscript(filename: string): TranscriptDraft["transcript"] {
  const baseText = `Mock transcript for ${filename}. This is a placeholder transcription generated locally to validate the capture flow.`;
  return {
    text: baseText,
    language: "en",
    confidence: 0.98,
    segments: [
      {
        id: randomUUID(),
        start: 0,
        end: 2.4,
        text: "Mock transcript generated locally.",
      },
      {
        id: randomUUID(),
        start: 2.4,
        end: 5.8,
        text: "Use this draft to test the voice-to-draft workflow.",
      },
    ],
  };
}

async function createDraftFromAudio(file: File): Promise<TranscriptDraft> {
  const draftId = randomUUID();
  const transcript = buildMockTranscript(file.name || "audio-file");

  return {
    id: draftId,
    createdAt: new Date().toISOString(),
    source: {
      filename: file.name || "audio-file",
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    },
    transcript,
  };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Invalid content type. Expected multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const audioField = formData.get("audio");

    if (!(audioField instanceof File)) {
      return NextResponse.json(
        { error: 'Missing audio file. Expected form field "audio".' },
        { status: 400 }
      );
    }

    if (!isValidAudioFile(audioField)) {
      return NextResponse.json(
        { error: "Invalid audio file. Please upload a non-empty audio file." },
        { status: 400 }
      );
    }

    const draft = await createDraftFromAudio(audioField);
    const store = getDraftStore();
    store.drafts.set(draft.id, draft);

    return NextResponse.json(
      {
        draftId: draft.id,
        transcript: draft.transcript,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Transcription route error:", error);

    return NextResponse.json(
      {
        error: "Failed to process transcription request.",
      },
      { status: 500 }
    );
  }
}