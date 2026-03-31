export type TranscriptionProvider = 'whisper' | 'assemblyai' | 'auto';

export interface TranscriptionResult {
  text: string;
  provider: Exclude<TranscriptionProvider, 'auto'>;
  language?: string;
  durationMs?: number;
  confidence?: number;
  raw?: unknown;
}

export class TranscriptionError extends Error {
  readonly code: string;
  readonly provider?: string;
  readonly cause?: unknown;

  constructor(message: string, options?: { code?: string; provider?: string; cause?: unknown }) {
    super(message);
    this.name = 'TranscriptionError';
    this.code = options?.code ?? 'TRANSCRIPTION_ERROR';
    this.provider = options?.provider;
    this.cause = options?.cause;
  }
}

type AudioFormat = string;

type ProviderTranscribeFn = (
  audioBuffer: Buffer,
  format: AudioFormat
) => Promise<TranscriptionResult>;

const DEFAULT_PROVIDER: TranscriptionProvider = 'auto';
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeProvider(value?: string): TranscriptionProvider {
  const normalized = (value ?? DEFAULT_PROVIDER).toLowerCase();
  if (normalized === 'whisper' || normalized === 'assemblyai' || normalized === 'auto') {
    return normalized;
  }
  return DEFAULT_PROVIDER;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return true;

  const anyError = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    name?: string;
    message?: string;
  };

  const status = anyError.status ?? anyError.statusCode;
  if (typeof status === 'number') {
    return status >= 500 || status === 408 || status === 429;
  }

  const code = anyError.code?.toUpperCase();
  if (code && ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) {
    return true;
  }

  const message = (anyError.message ?? '').toLowerCase();
  if (
    message.includes('timeout') ||
    message.includes('rate limit') ||
    message.includes('temporarily unavailable') ||
    message.includes('network error')
  ) {
    return true;
  }

  return false;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_RETRIES || !isRetryableError(error)) {
        break;
      }

      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(`[transcription] ${label} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

function validateAudioInput(audioBuffer: Buffer, format: string): void {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    throw new TranscriptionError('Invalid audio buffer provided', { code: 'INVALID_AUDIO_INPUT' });
  }

  if (!format || typeof format !== 'string') {
    throw new TranscriptionError('Audio format is required', { code: 'INVALID_AUDIO_FORMAT' });
  }
}

async function transcribeWithWhisper(audioBuffer: Buffer, format: AudioFormat): Promise<TranscriptionResult> {
  const apiKey = getEnv('TRANSCRIPTION_API_KEY');
  if (!apiKey) {
    throw new TranscriptionError('Missing TRANSCRIPTION_API_KEY for Whisper provider', {
      code: 'MISSING_API_KEY',
      provider: 'whisper',
    });
  }

  const endpoint = getEnv('WHISPER_API_URL') ?? 'https://api.openai.com/v1/audio/transcriptions';

  const formData = new FormData();
  const blob = new Blob([audioBuffer], { type: `audio/${format}` });
  formData.append('file', blob, `audio.${format}`);
  formData.append('model', getEnv('WHISPER_MODEL') ?? 'whisper-1');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new TranscriptionError(`Whisper transcription failed with status ${response.status}`, {
      code: 'PROVIDER_REQUEST_FAILED',
      provider: 'whisper',
      cause: body,
    });
  }

  const data = (await response.json()) as {
    text?: string;
    language?: string;
    duration?: number;
    confidence?: number;
  };

  if (!data?.text) {
    throw new TranscriptionError('Whisper provider returned an empty transcription', {
      code: 'EMPTY_TRANSCRIPTION',
      provider: 'whisper',
      cause: data,
    });
  }

  return {
    text: data.text,
    provider: 'whisper',
    language: data.language,
    durationMs: typeof data.duration === 'number' ? Math.round(data.duration * 1000) : undefined,
    confidence: data.confidence,
    raw: data,
  };
}

async function transcribeWithAssemblyAI(audioBuffer: Buffer, format: AudioFormat): Promise<TranscriptionResult> {
  const apiKey = getEnv('TRANSCRIPTION_API_KEY');
  if (!apiKey) {
    throw new TranscriptionError('Missing TRANSCRIPTION_API_KEY for AssemblyAI provider', {
      code: 'MISSING_API_KEY',
      provider: 'assemblyai',
    });
  }

  const uploadUrl = getEnv('ASSEMBLYAI_UPLOAD_URL') ?? 'https://api.assemblyai.com/v2/upload';
  const transcriptUrl = getEnv('ASSEMBLYAI_TRANSCRIPT_URL') ?? 'https://api.assemblyai.com/v2/transcript';

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/octet-stream',
    },
    body: audioBuffer,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => '');
    throw new TranscriptionError(`AssemblyAI upload failed with status ${uploadResponse.status}`, {
      code: 'PROVIDER_REQUEST_FAILED',
      provider: 'assemblyai',
      cause: body,
    });
  }

  const uploadData = (await uploadResponse.json()) as { upload_url?: string };
  if (!uploadData.upload_url) {
    throw new TranscriptionError('AssemblyAI upload did not return an upload URL', {
      code: 'INVALID_PROVIDER_RESPONSE',
      provider: 'assemblyai',
      cause: uploadData,
    });
  }

  const transcriptResponse = await fetch(transcriptUrl, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: uploadData.upload_url,
      language_detection: true,
      punctuate: true,
      format,
    }),
  });

  if (!transcriptResponse.ok) {
    const body = await transcriptResponse.text().catch(() => '');
    throw new TranscriptionError(`AssemblyAI transcript request failed with status ${transcriptResponse.status}`, {
      code: 'PROVIDER_REQUEST_FAILED',
      provider: 'assemblyai',
      cause: body,
    });
  }

  const transcriptData = (await transcriptResponse.json()) as {
    text?: string;
    language_code?: string;
    confidence?: number;
    duration?: number;
    status?: string;
    error?: string;
  };

  if (transcriptData.status && transcriptData.status !== 'completed') {
    throw new TranscriptionError(`AssemblyAI transcription not completed: ${transcriptData.status}`, {
      code: 'TRANSCRIPTION_NOT_READY',
      provider: 'assemblyai',
      cause: transcriptData.error ?? transcriptData,
    });
  }

  if (!transcriptData.text) {
    throw new TranscriptionError('AssemblyAI provider returned an empty transcription', {
      code: 'EMPTY_TRANSCRIPTION',
      provider: 'assemblyai',
      cause: transcriptData,
    });
  }

  return {
    text: transcriptData.text,
    provider: 'assemblyai',
    language: transcriptData.language_code,
    durationMs: typeof transcriptData.duration === 'number' ? Math.round(transcriptData.duration * 1000) : undefined,
    confidence: transcriptData.confidence,
    raw: transcriptData,
  };
}

function getProviderOrder(provider: TranscriptionProvider): Exclude<TranscriptionProvider, 'auto'>[] {
  if (provider === 'whisper') return ['whisper'];
  if (provider === 'assemblyai') return ['assemblyai'];
  return ['whisper', 'assemblyai'];
}

function getProviderFn(provider: Exclude<TranscriptionProvider, 'auto'>): ProviderTranscribeFn {
  switch (provider) {
    case 'whisper':
      return transcribeWithWhisper;
    case 'assemblyai':
      return transcribeWithAssemblyAI;
    default:
      return transcribeWithWhisper;
  }
}

export async function transcribe(audioBuffer: Buffer, format: string): Promise<TranscriptionResult> {
  validateAudioInput(audioBuffer, format);

  const configuredProvider = normalizeProvider(getEnv('TRANSCRIPTION_PROVIDER'));
  const providers = getProviderOrder(configuredProvider);

  let lastError: unknown;

  for (let index = 0; index < providers.length; index += 1) {
    const provider = providers[index];
    const transcribeFn = getProviderFn(provider);

    try {
      return await withRetry(() => transcribeFn(audioBuffer, format), provider);
    } catch (error) {
      lastError = error;

      const isLastProvider = index === providers.length - 1;
      if (!isLastProvider) {
        console.warn(`[transcription] provider ${provider} failed, trying fallback provider`);
        continue;
      }
    }
  }

  if (lastError instanceof TranscriptionError) {
    throw lastError;
  }

  throw new TranscriptionError('Transcription failed for all configured providers', {
    code: 'ALL_PROVIDERS_FAILED',
    cause: lastError,
  });
}