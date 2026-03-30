type DeepgramResponse = {
  results?: {
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string;
      }>;
    }>;
  };
  error?: string;
};

function isBufferLike(value: unknown): value is Buffer {
  return typeof Buffer !== "undefined" && Buffer.isBuffer(value);
}

function getDeepgramApiKey(): string | undefined {
  return process.env.DEEPGRAM_API_KEY?.trim() || undefined;
}

function shouldUseMockFallback(): boolean {
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  return nodeEnv === "development" || nodeEnv === "test";
}

function logError(message: string, error: unknown): void {
  const details =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { error };

  console.error(`[transcription] ${message}`, details);
}

function extractTranscript(payload: DeepgramResponse): string {
  const transcript =
    payload.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || "";

  return transcript;
}

async function transcribeWithDeepgram(audioBuffer: Buffer): Promise<string> {
  const apiKey = getDeepgramApiKey();
  if (!apiKey) {
    throw new Error("DEEPGRAM_API_KEY is missing");
  }

  const url = new URL("https://api.deepgram.com/v1/listen");
  url.searchParams.set("model", process.env.DEEPGRAM_MODEL?.trim() || "nova-2");
  url.searchParams.set("smart_format", "true");
  url.searchParams.set("punctuate", "true");

  const contentType =
    process.env.DEEPGRAM_CONTENT_TYPE?.trim() || "audio/wav";

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": contentType,
      },
      body: audioBuffer,
    });
  } catch (error) {
    logError("Network error while calling Deepgram", error);
    throw new Error("Failed to reach Deepgram transcription service");
  }

  let payload: DeepgramResponse | undefined;
  try {
    payload = (await response.json()) as DeepgramResponse;
  } catch (error) {
    logError("Failed to parse Deepgram response JSON", error);
    throw new Error("Invalid response from Deepgram transcription service");
  }

  if (!response.ok) {
    const apiMessage =
      payload?.error?.trim() ||
      `Deepgram request failed with status ${response.status}`;
    throw new Error(apiMessage);
  }

  const transcript = extractTranscript(payload);
  if (!transcript) {
    throw new Error("Deepgram returned an empty transcript");
  }

  return transcript;
}

function mockTranscribe(audioBuffer: Buffer): string {
  const byteLength = audioBuffer.byteLength;
  return `Mock transcript (${byteLength} bytes)`;
}

export async function transcribe(audioBuffer: Buffer): Promise<string> {
  if (!isBufferLike(audioBuffer) || audioBuffer.length === 0) {
    throw new Error("audioBuffer must be a non-empty Buffer");
  }

  const apiKey = getDeepgramApiKey();

  if (!apiKey) {
    if (shouldUseMockFallback()) {
      console.warn(
        "[transcription] DEEPGRAM_API_KEY missing; using mock transcription fallback"
      );
      return mockTranscribe(audioBuffer);
    }

    throw new Error("DEEPGRAM_API_KEY is required for transcription");
  }

  try {
    return await transcribeWithDeepgram(audioBuffer);
  } catch (error) {
    logError("Deepgram transcription failed", error);

    if (shouldUseMockFallback()) {
      console.warn("[transcription] Falling back to mock transcription");
      return mockTranscribe(audioBuffer);
    }

    throw error instanceof Error
      ? error
      : new Error("Transcription failed unexpectedly");
  }
}