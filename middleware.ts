import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'session_token';

const PUBLIC_PATH_PREFIXES = ['/signup', '/api/create-payment-intent'];
const PUBLIC_PATH_EXACT = new Set<string>(['/']);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATH_EXACT.has(pathname)) return true;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAppPath(pathname: string): boolean {
  return pathname === '/app' || pathname.startsWith('/app/');
}

function getSessionToken(request: NextRequest): string | undefined {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  const value = cookie?.value?.trim();
  return value ? value : undefined;
}

export function middleware(request: NextRequest): NextResponse {
  try {
    const { pathname, search } = request.nextUrl;

    if (isPublicPath(pathname) || !isAppPath(pathname)) {
      return NextResponse.next();
    }

    const sessionToken = getSessionToken(request);
    if (sessionToken) {
      return NextResponse.next();
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/signup';
    redirectUrl.search = search;

    return NextResponse.redirect(redirectUrl);
  } catch {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/signup';
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ['/app/:path*', '/signup', '/api/create-payment-intent/:path*'],
};