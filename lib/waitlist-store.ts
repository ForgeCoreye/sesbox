const waitlist = new Set<string>();

function normalizeEmail(email: string): string {
  if (typeof email !== "string") {
    throw new TypeError("email must be a string");
  }

  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    throw new Error("email is required");
  }

  return normalized;
}

export function add(email: string): boolean {
  try {
    const normalized = normalizeEmail(email);
    const alreadyExists = waitlist.has(normalized);

    if (alreadyExists) {
      console.info("[waitlist-store] duplicate email ignored", { email: normalized });
      return false;
    }

    waitlist.add(normalized);
    console.info("[waitlist-store] email added", { email: normalized, size: waitlist.size });
    return true;
  } catch (error) {
    console.error("[waitlist-store] failed to add email", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export function exists(email: string): boolean {
  try {
    const normalized = normalizeEmail(email);
    const result = waitlist.has(normalized);

    console.info("[waitlist-store] exists check", { email: normalized, exists: result });
    return result;
  } catch (error) {
    console.error("[waitlist-store] failed to check email", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}