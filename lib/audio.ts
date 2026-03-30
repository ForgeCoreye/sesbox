const DEFAULT_MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB
const DEFAULT_ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/ogg",
  "audio/ogg;codecs=opus",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/m4a",
  "audio/x-m4a",
];

export class AudioValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioValidationError";
  }
}

export type AudioValidationOptions = {
  maxBytes?: number;
  allowedMimeTypes?: string[];
};

export type AudioFormDataOptions = AudioValidationOptions & {
  fieldName?: string;
  fileName?: string;
};

function isBlobLike(value: unknown): value is Blob {
  return (
    typeof value === "object" &&
    value !== null &&
    "size" in value &&
    "type" in value &&
    typeof (value as Blob).size === "number" &&
    typeof (value as Blob).type === "string" &&
    typeof (value as Blob).slice === "function"
  );
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.trim().toLowerCase();
}

function getAllowedMimeTypes(options?: AudioValidationOptions): string[] {
  const types = options?.allowedMimeTypes?.length
    ? options.allowedMimeTypes
    : DEFAULT_ALLOWED_AUDIO_MIME_TYPES;

  return types.map(normalizeMimeType);
}

function getMaxBytes(options?: AudioValidationOptions): number {
  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_AUDIO_BYTES;
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new AudioValidationError("Invalid maxBytes value");
  }
  return Math.floor(maxBytes);
}

export function validateAudioBlob(
  blob: Blob,
  options?: AudioValidationOptions
): void {
  if (!isBlobLike(blob)) {
    throw new AudioValidationError("Invalid audio payload: expected a Blob");
  }

  const maxBytes = getMaxBytes(options);
  const allowedMimeTypes = getAllowedMimeTypes(options);
  const mimeType = normalizeMimeType(blob.type || "");

  if (blob.size <= 0) {
    throw new AudioValidationError("Audio blob is empty");
  }

  if (blob.size > maxBytes) {
    throw new AudioValidationError(
      `Audio blob exceeds maximum size of ${maxBytes} bytes`
    );
  }

  if (!mimeType) {
    throw new AudioValidationError("Audio blob is missing a MIME type");
  }

  if (!allowedMimeTypes.includes(mimeType)) {
    throw new AudioValidationError(
      `Unsupported audio MIME type: ${blob.type}`
    );
  }
}

export function audioBlobToFormData(
  blob: Blob,
  options?: AudioFormDataOptions
): FormData {
  validateAudioBlob(blob, options);

  const fieldName = options?.fieldName ?? "audio";
  const fileName = options?.fileName ?? "audio.webm";

  const formData = new FormData();
  formData.append(fieldName, blob, fileName);

  return formData;
}

export function createAudioUploadFormData(
  blob: Blob,
  options?: AudioFormDataOptions
): FormData {
  return audioBlobToFormData(blob, options);
}

export function isSupportedAudioMimeType(
  mimeType: string,
  options?: AudioValidationOptions
): boolean {
  const normalized = normalizeMimeType(mimeType);
  return getAllowedMimeTypes(options).includes(normalized);
}