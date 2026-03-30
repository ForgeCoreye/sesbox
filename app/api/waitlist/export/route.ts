import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getStoredEmails(): string[] {
  const globalAny = globalThis as typeof globalThis & {
    __waitlistEmails?: unknown;
  };

  const emails = globalAny.__waitlistEmails;
  if (!Array.isArray(emails)) return [];

  return emails
    .filter((email): email is string => typeof email === 'string')
    .map((email) => email.trim())
    .filter(Boolean);
}

function isAuthorized(request: NextRequest): boolean {
  const expectedToken = process.env.WAITLIST_EXPORT_TOKEN;
  if (!expectedToken) return false;

  const token = request.nextUrl.searchParams.get('token');
  if (!token) return false;

  return token === expectedToken;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emails = getStoredEmails();
    return NextResponse.json(emails, { status: 200 });
  } catch (error) {
    console.error('Failed to export waitlist emails:', error);
    return NextResponse.json(
      { error: 'Failed to export waitlist emails' },
      { status: 500 }
    );
  }
}