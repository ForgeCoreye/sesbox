export type Draft = {
  headline: string;
  bullets: string[];
};

const MAX_BULLETS = 5;
const MIN_HEADLINE_WORDS = 3;
const MAX_HEADLINE_WORDS = 12;

function normalizeText(input: string): string {
  return (input || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoSentences(text: string): string[] {
  const cleaned = normalizeText(text);
  if (!cleaned) return [];

  const raw = cleaned
    .split(/(?<=[.!?])\s+|\n+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  if (raw.length > 0) return raw;

  return [cleaned];
}

function stripFillerPrefix(sentence: string): string {
  return sentence
    .replace(
      /^(um+|uh+|like|so|you know|i mean|basically|actually|right|okay|ok)\b[\s,.-]*/i,
      ""
    )
    .trim();
}

function sentenceToHeadlineCandidate(sentence: string): string {
  let s = stripFillerPrefix(sentence);

  s = s
    .replace(/^(today|this is|here's|heres|i want to|we want to|i'm going to|im going to)\b[\s:,-]*/i, "")
    .trim();

  s = s.replace(/[.!?]+$/g, "").trim();

  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > MAX_HEADLINE_WORDS) {
    s = words.slice(0, MAX_HEADLINE_WORDS).join(" ");
  }

  return s;
}

function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (/^(ai|api|ux|ui|mvp|saas|seo|crm|b2b|b2c)$/i.test(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function buildHeadline(transcription: string, sentences: string[]): string {
  const firstMeaningful =
    sentences.map(sentenceToHeadlineCandidate).find((s) => s.split(/\s+/).filter(Boolean).length >= MIN_HEADLINE_WORDS) ||
    sentenceToHeadlineCandidate(transcription);

  const fallback = "Draft Summary";

  const headlineBase = firstMeaningful || fallback;
  const headline = titleCase(headlineBase)
    .replace(/\s+/g, " ")
    .trim();

  if (!headline) return fallback;

  return headline.length > 80 ? headline.slice(0, 77).trimEnd() + "..." : headline;
}

function sentenceToBullet(sentence: string): string | null {
  let s = stripFillerPrefix(sentence);
  s = s.replace(/^[•*-]\s*/g, "").trim();
  s = s.replace(/[.!?]+$/g, "").trim();

  if (!s) return null;

  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 3) return null;

  if (s.length > 140) {
    s = words.slice(0, 22).join(" ");
    if (!s.endsWith("...")) s += "...";
  }

  return s;
}

function extractBullets(sentences: string[]): string[] {
  const bullets: string[] = [];

  for (const sentence of sentences) {
    const bullet = sentenceToBullet(sentence);
    if (!bullet) continue;

    const normalized = bullet.toLowerCase();
    if (bullets.some((existing) => existing.toLowerCase() === normalized)) continue;

    bullets.push(bullet);
    if (bullets.length >= MAX_BULLETS) break;
  }

  return bullets;
}

function fallbackBullets(transcription: string): string[] {
  const text = normalizeText(transcription);
  if (!text) return ["No transcription provided"];

  const words = text.split(/\s+/).filter(Boolean);
  const preview = words.slice(0, 18).join(" ");
  const bullet = preview.length < text.length ? `${preview}...` : preview;

  return [bullet || "Transcription received"];
}

export function generateDraft(transcription: string): Draft {
  try {
    const normalized = normalizeText(transcription);
    const sentences = splitIntoSentences(normalized);

    const headline = buildHeadline(normalized, sentences);
    const bullets = extractBullets(sentences);

    return {
      headline: headline || "Draft Summary",
      bullets: bullets.length > 0 ? bullets : fallbackBullets(normalized),
    };
  } catch {
    return {
      headline: "Draft Summary",
      bullets: ["Unable to parse transcription"],
    };
  }
}