import { NextResponse } from 'next/server';

import {
  createSessionToken,
  getSessionCookieConfig,
  isAllowedCredentials,
  isAuthConfigured,
  sanitizeRedirectPath,
} from '@/lib/auth-core';

function redirectWithError(request: Request, nextPath: string, error: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('error', error);

  if (nextPath !== '/') {
    loginUrl.searchParams.set('next', nextPath);
  }

  return NextResponse.redirect(loginUrl);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const nextPath = sanitizeRedirectPath(String(formData.get('next') ?? '/'));

  if (!isAuthConfigured()) {
    return redirectWithError(request, nextPath, 'config');
  }

  if (!isAllowedCredentials(email, password)) {
    return redirectWithError(request, nextPath, 'credentials');
  }

  const token = await createSessionToken(email);
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const sessionCookie = getSessionCookieConfig(token);
  const { name, value, ...options } = sessionCookie;

  response.cookies.set(name, value, options);

  return response;
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL('/login', request.url));
}
