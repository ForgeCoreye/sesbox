export type DraftLike = {
  id?: string | null;
  title?: string | null;
  body?: string | null;
  content?: string | null;
  text?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  timestamp?: string | Date | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | { [key: string]: SerializableValue };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toIsoTimestamp(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function escapeJsonValue(value: unknown): SerializableValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => escapeJsonValue(item));
  }

  if (isPlainObject(value)) {
    const result: Record<string, SerializableValue> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[key] = escapeJsonValue(nested);
    }
    return result;
  }

  return String(value);
}

function cleanText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getDraftTitle(draft: DraftLike): string {
  const title =
    cleanText(draft.title) ||
    cleanText((draft as { name?: unknown }).name) ||
    cleanText((draft as { subject?: unknown }).subject);

  return title || "Untitled Draft";
}

function getDraftBody(draft: DraftLike): string {
  const body =
    cleanText(draft.body) ||
    cleanText(draft.content) ||
    cleanText(draft.text) ||
    "";

  return body;
}

function getDraftTimestamp(draft: DraftLike): string {
  return toIsoTimestamp(draft.updatedAt ?? draft.createdAt ?? draft.timestamp);
}

function buildMetadata(draft: DraftLike): Record<string, SerializableValue> {
  const metadata: Record<string, SerializableValue> = {
    id: cleanText(draft.id) || null,
    title: getDraftTitle(draft),
    timestamp: getDraftTimestamp(draft),
  };

  if (isPlainObject(draft.metadata)) {
    metadata.metadata = escapeJsonValue(draft.metadata) as {
      [key: string]: SerializableValue;
    };
  }

  return metadata;
}

function yamlEscape(value: string): string {
  if (value.length === 0) return '""';
  if (/^[A-Za-z0-9._-]+$/.test(value)) return value;
  return JSON.stringify(value);
}

function toFrontmatterValue(value: SerializableValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return yamlEscape(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => toFrontmatterValue(item)).join(", ")}]`;
  }
  return JSON.stringify(value);
}

function buildFrontmatter(metadata: Record<string, SerializableValue>): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(metadata)) {
    lines.push(`${key}: ${toFrontmatterValue(value)}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function normalizeBodyForMarkdown(body: string): string {
  return body.replace(/\r\n/g, "\n").trim();
}

export function toJSON(draft: DraftLike): string {
  try {
    const payload = {
      metadata: buildMetadata(draft),
      draft: {
        id: cleanText(draft.id) || null,
        title: getDraftTitle(draft),
        body: getDraftBody(draft),
        timestamp: getDraftTimestamp(draft),
      },
    };

    return JSON.stringify(payload, null, 2);
  } catch (error) {
    const fallback = {
      metadata: {
        title: "Untitled Draft",
        timestamp: new Date().toISOString(),
      },
      draft: {
        title: "Untitled Draft",
        body: "",
      },
      error: error instanceof Error ? error.message : "Failed to serialize draft",
    };

    return JSON.stringify(fallback, null, 2);
  }
}

export function toMarkdown(draft: DraftLike): string {
  try {
    const title = getDraftTitle(draft);
    const timestamp = getDraftTimestamp(draft);
    const body = normalizeBodyForMarkdown(getDraftBody(draft));

    const frontmatter = buildFrontmatter({
      title,
      timestamp,
      id: cleanText(draft.id) || null,
    });

    const heading = `# ${title}`;
    const content = body ? `\n\n${body}` : "\n\n";

    return `${frontmatter}\n${heading}${content}`.trimEnd() + "\n";
  } catch {
    const frontmatter = buildFrontmatter({
      title: "Untitled Draft",
      timestamp: new Date().toISOString(),
    });

    return `${frontmatter}\n# Untitled Draft\n`;
  }
}