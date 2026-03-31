import { NextRequest, NextResponse } from 'next/server';

type WaitlistEntry = {
  email: string;
  createdAt: string;
};

const globalForWaitlist = globalThis as unknown as {
  __waitlistStore?: Map<string, WaitlistEntry>;
};

const waitlistStore: Map<string, WaitlistEntry> =
  globalForWaitlist.__waitlistStore ?? new Map<string, WaitlistEntry>();

if (!globalForWaitlist.__waitlistStore) {
  globalForWaitlist.__waitlistStore = waitlistStore;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  // Practical email validation for MVP
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized);
}

function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return jsonError('Content-Type must be application/json');
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError('Invalid JSON body');
    }

    if (!body || typeof body !== 'object') {
      return jsonError('Request body must be a JSON object');
    }

    const email = (body as { email?: unknown }).email;
    if (typeof email !== 'string') {
      return jsonError('Email is required');
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isValidEmail(normalizedEmail)) {
      return jsonError('Invalid email format');
    }

    if (waitlistStore.has(normalizedEmail)) {
      return jsonError('Email already exists');
    }

    waitlistStore.set(normalizedEmail, {
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined the waitlist',
        email: normalizedEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Waitlist POST error:', error);
    return jsonError('Internal server error', 400);
  }
}