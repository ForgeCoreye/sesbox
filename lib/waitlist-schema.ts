export interface WaitlistFormData {
  email: string;
  name?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

export function validateEmail(email: unknown): string | null {
  if (typeof email !== "string") {
    return "Email must be a string.";
  }
  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return "Email is required.";
  }
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return `Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`;
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validateName(name: unknown): string | null {
  if (name === undefined || name === null || name === "") {
    return null;
  }
  if (typeof name !== "string") {
    return "Name must be a string.";
  }
  const trimmed = name.trim();
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateWaitlistForm(data: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: { form: "Invalid form data." },
    };
  }

  const raw = data as Record<string, unknown>;

  const emailError = validateEmail(raw.email);
  if (emailError) {
    errors.email = emailError;
  }

  const nameError = validateName(raw.name);
  if (nameError) {
    errors.name = nameError;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function normalizeWaitlistForm(data: unknown): WaitlistFormData | null {
  const result = validateWaitlistForm(data);
  if (!result.valid) {
    return null;
  }

  const raw = data as Record<string, unknown>;

  return {
    email: (raw.email as string).trim().toLowerCase(),
    name:
      typeof raw.name === "string" && raw.name.trim().length > 0
        ? raw.name.trim()
        : undefined,
  };
}

export function formatValidationErrors(
  errors: Record<string, string>
): string[] {
  return Object.values(errors).filter(
    (msg): msg is string => typeof msg === "string" && msg.length > 0
  );
}