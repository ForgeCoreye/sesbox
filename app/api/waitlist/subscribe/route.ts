import { NextResponse } from "next/server";

type SubscribeRequestBody = {
  email?: unknown;
};

type Subscriber = {
  email: string;
  createdAt: string;
};

const emailStore: Subscriber[] =
  (globalThis as typeof globalThis & { __waitlistSubscribers?: Subscriber[] })
    .__waitlistSubscribers ?? [];

if (
  !(globalThis as typeof globalThis & { __waitlistSubscribers?: Subscriber[] })
    .__waitlistSubscribers
) {
  (globalThis as typeof globalThis & { __waitlistSubscribers?: Subscriber[] })
    .__waitlistSubscribers = emailStore;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function isDuplicateEmail(email: string): boolean {
  return emailStore.some((subscriber) => subscriber.email === email);
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: SubscribeRequestBody = {};

    if (contentType.includes("application/json")) {
      body = (await request.json().catch(() => ({}))) as SubscribeRequestBody;
    } else {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        body = { email: formData.get("email") ?? undefined };
      }
    }

    const email = normalizeEmail(body.email);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address." },
        { status: 400 }
      );
    }

    if (isDuplicateEmail(email)) {
      return NextResponse.json(
        { success: true, message: "Email already subscribed." },
        { status: 200 }
      );
    }

    emailStore.push({
      email,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      { success: true, message: "Subscribed successfully." },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to process subscription." },
      { status: 500 }
    );
  }
}