export type DraftExportFormat = "markdown" | "pdf";

export interface DraftContentLike {
  title?: string;
  body?: string;
  content?: string;
  transcript?: string;
  text?: string;
}

export interface DraftMetrics {
  wordCount: number;
  estimatedReadTimeMinutes: number;
}

const DEFAULT_WORDS_PER_MINUTE = 200;

function toSafeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return String(value);
  } catch {
    return "";
  }
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

export function calculateWordCount(input: string | DraftContentLike): number {
  try {
    const text =
      typeof input === "string"
        ? input
        : toSafeString(input.body || input.content || input.transcript || input.text || input.title || "");

    const normalized = normalizeWhitespace(text);
    if (!normalized) return 0;

    const words = normalized.split(" ").filter(Boolean);
    return words.length;
  } catch {
    return 0;
  }
}

export function estimateReadTimeMinutes(
  input: string | DraftContentLike,
  wordsPerMinute: number = DEFAULT_WORDS_PER_MINUTE
): number {
  try {
    const safeWpm = Number.isFinite(wordsPerMinute) && wordsPerMinute > 0 ? wordsPerMinute : DEFAULT_WORDS_PER_MINUTE;
    const wordCount = calculateWordCount(input);
    if (wordCount === 0) return 0;

    return Math.max(1, Math.ceil(wordCount / safeWpm));
  } catch {
    return 0;
  }
}

export function getDraftMetrics(input: string | DraftContentLike): DraftMetrics {
  return {
    wordCount: calculateWordCount(input),
    estimatedReadTimeMinutes: estimateReadTimeMinutes(input),
  };
}

export function formatDraftForMarkdown(input: DraftContentLike | string): string {
  try {
    const text =
      typeof input === "string"
        ? input
        : toSafeString(input.body || input.content || input.transcript || input.text || "");

    const title = typeof input === "string" ? "" : toSafeString(input.title || "").trim();
    const body = normalizeWhitespace(text);

    if (!title && !body) return "";

    const parts: string[] = [];
    if (title) parts.push(`# ${title}`);
    if (body) parts.push(body);

    return parts.join("\n\n");
  } catch {
    return "";
  }
}

export function formatDraftForPDF(input: DraftContentLike | string): string {
  try {
    const text =
      typeof input === "string"
        ? input
        : toSafeString(input.body || input.content || input.transcript || input.text || "");

    const title = typeof input === "string" ? "" : toSafeString(input.title || "").trim();
    const body = normalizeWhitespace(text);

    if (!title && !body) return "";

    const parts: string[] = [];
    if (title) parts.push(title);
    if (body) parts.push(body);

    return parts.join("\n\n");
  } catch {
    return "";
  }
}

export function prepareDraftExport(
  input: DraftContentLike | string,
  format: DraftExportFormat
): string {
  try {
    switch (format) {
      case "markdown":
        return formatDraftForMarkdown(input);
      case "pdf":
        return formatDraftForPDF(input);
      default:
        return "";
    }
  } catch {
    return "";
  }
}