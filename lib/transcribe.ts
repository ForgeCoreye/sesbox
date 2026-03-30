export type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

export type Transcript = {
  text: string;
  language: string;
  durationMs: number;
  segments: TranscriptSegment[];
};

export type Draft = {
  id: string;
  transcript: Transcript;
  createdAt: string;
};

type DraftStore = {
  create: (transcript: Transcript) => Promise<Draft>;
  get: (id: string) => Promise<Draft | null>;
};

const draftStoreKey = "__sesbox_drafts__";

function getGlobalDraftMap(): Map<string, Draft> {
  const globalForDrafts = globalThis as typeof globalThis & {
    [draftStoreKey]?: Map<string, Draft>;
  };

  if (!globalForDrafts[draftStoreKey]) {
    globalForDrafts[draftStoreKey] = new Map<string, Draft>();
  }

  return globalForDrafts[draftStoreKey]!;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `draft_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function clampText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function buildMockTranscriptText(fileName?: string): string {
  const base = fileName ? `Recorded note from ${fileName}` : "Recorded voice note";
  return clampText(
    `${base}. I want to turn this into a polished draft for my audience. The main idea is to capture the key points, keep the tone natural, and make it easy to publish.`
  );
}

function buildMockSegments(text: string): TranscriptSegment[] {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let cursor = 0;

  return parts.map((part, index) => {
    const start = cursor;
    const duration = Math.max(1200, Math.min(5000, part.length * 80));
    const end = start + duration;
    cursor = end + 250;

    return {
      start,
      end,
      text: index === 0 ? part : part.trim(),
    };
  });
}

export async function transcribeMock(
  audio: Blob | ArrayBuffer | Uint8Array | null | undefined,
  options?: { fileName?: string; language?: string }
): Promise<Transcript> {
  try {
    const size =
      audio instanceof Blob
        ? audio.size
        : audio instanceof ArrayBuffer
          ? audio.byteLength
          : audio instanceof Uint8Array
            ? audio.byteLength
            : 0;

    const durationMs = Math.max(1500, Math.min(180000, Math.round(size * 12)));

    const text = buildMockTranscriptText(options?.fileName);
    const segments = buildMockSegments(text);

    return {
      text,
      language: options?.language ?? "en",
      durationMs,
      segments,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown transcription error";
    throw new Error(`Mock transcription failed: ${message}`);
  }
}

export const draftStore: DraftStore = {
  async create(transcript: Transcript): Promise<Draft> {
    if (!transcript || typeof transcript.text !== "string") {
      throw new Error("Invalid transcript payload");
    }

    const draft: Draft = {
      id: createId(),
      transcript,
      createdAt: new Date().toISOString(),
    };

    getGlobalDraftMap().set(draft.id, draft);
    return draft;
  },

  async get(id: string): Promise<Draft | null> {
    if (!id || typeof id !== "string") {
      return null;
    }

    return getGlobalDraftMap().get(id) ?? null;
  },
};

export async function transcribeAndCreateDraft(
  audio: Blob | ArrayBuffer | Uint8Array | null | undefined,
  options?: { fileName?: string; language?: string }
): Promise<{ transcript: Transcript; draft: Draft }> {
  const transcript = await transcribeMock(audio, options);
  const draft = await draftStore.create(transcript);

  return { transcript, draft };
}