import { describe, expect, it, vi, beforeEach } from "vitest";

type TranscriptionResult = {
  text: string;
  provider?: string;
};

const mockTranscribe = vi.fn<
  [audioBuffer: Buffer, format?: string],
  Promise<TranscriptionResult>
>();

vi.mock("../transcription", () => {
  return {
    transcribe: mockTranscribe,
  };
});

async function loadTranscriptionModule() {
  return await import("../transcription");
}

describe("transcription adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TRANSCRIPTION_PROVIDER;
    delete process.env.TRANSCRIPTION_API_KEY;
  });

  it("handles the happy path with a mocked response", async () => {
    mockTranscribe.mockResolvedValueOnce({
      text: "Hello world",
      provider: "whisper",
    });

    const { transcribe } = await loadTranscriptionModule();
    const audio = Buffer.from("fake-audio-data");

    const result = await transcribe(audio, "mp3");

    expect(result).toEqual({
      text: "Hello world",
      provider: "whisper",
    });
    expect(mockTranscribe).toHaveBeenCalledTimes(1);
    expect(mockTranscribe).toHaveBeenCalledWith(audio, "mp3");
  });

  it("handles errors from the transcription provider", async () => {
    mockTranscribe.mockRejectedValueOnce(new Error("Provider unavailable"));

    const { transcribe } = await loadTranscriptionModule();
    const audio = Buffer.from("fake-audio-data");

    await expect(transcribe(audio, "wav")).rejects.toThrow("Provider unavailable");
    expect(mockTranscribe).toHaveBeenCalledTimes(1);
    expect(mockTranscribe).toHaveBeenCalledWith(audio, "wav");
  });

  it("supports provider selection logic via env configuration", async () => {
    process.env.TRANSCRIPTION_PROVIDER = "assemblyai";
    process.env.TRANSCRIPTION_API_KEY = "KEY=placeholder";

    mockTranscribe.mockResolvedValueOnce({
      text: "Selected provider result",
      provider: "assemblyai",
    });

    const { transcribe } = await loadTranscriptionModule();
    const audio = Buffer.from("fake-audio-data");

    const result = await transcribe(audio, "webm");

    expect(result.provider).toBe("assemblyai");
    expect(result.text).toBe("Selected provider result");
    expect(mockTranscribe).toHaveBeenCalledTimes(1);
    expect(mockTranscribe).toHaveBeenCalledWith(audio, "webm");
  });
});