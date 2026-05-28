import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  AUTH_COOKIE_NAME,
  isAuthConfigured,
  sanitizeRedirectPath,
  shouldFailClosed,
  verifySessionToken,
} from '@/lib/auth-core';

function buildLoginRedirect(request: NextRequest, error?: string) {
  const loginUrl = new URL('/login', request.url);
  const nextPath = sanitizeRedirectPath(
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );

  if (nextPath !== '/login') {
    loginUrl.searchParams.set('next', nextPath);
  }

  if (error) {
    loginUrl.searchParams.set('error', error);
  }

  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === '/login';
  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isApiRoute = pathname.startsWith('/api/');

  if (!isAuthConfigured()) {
    if (!shouldFailClosed() || isLoginRoute || isAuthRoute) {
      return NextResponse.next();
    }

    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Falta configurar AUTH_SECRET y AUTH_ALLOWED_USERS.' },
        { status: 503 }
      );
    }

    return buildLoginRedirect(request, 'config');
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  const session = await verifySessionToken(token);

  if (session) {
    if (isLoginRoute) {
      const destination = sanitizeRedirectPath(
        request.nextUrl.searchParams.get('next')
      );
      return NextResponse.redirect(new URL(destination, request.url));
    }

    return NextResponse.next();
  }

  if (isLoginRoute || isAuthRoute) {
    return NextResponse.next();
  }

  if (isApiRoute) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  return buildLoginRedirect(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
