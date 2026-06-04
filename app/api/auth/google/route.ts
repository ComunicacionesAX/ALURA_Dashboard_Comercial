import { NextResponse } from 'next/server';

import { sanitizeRedirectPath } from '@/lib/auth-core';

function generateState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nextPath = sanitizeRedirectPath(url.searchParams.get('next'));
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!clientId) {
    return NextResponse.redirect(new URL('/login?error=config', request.url));
  }

  const state = generateState();
  const redirectUri = new URL('/api/auth/google/callback', request.url).toString();

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'email');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'online');
  authUrl.searchParams.set('prompt', 'select_account');

  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
    path: '/',
  };

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state', state, cookieOpts);
  response.cookies.set('oauth_next', nextPath, cookieOpts);

  return response;
}
