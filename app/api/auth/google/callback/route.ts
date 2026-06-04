import { NextResponse } from 'next/server';

import {
  createSessionToken,
  getSessionCookieConfig,
  isAllowedEmail,
  isAuthConfigured,
  sanitizeRedirectPath,
} from '@/lib/auth-core';

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (key === name) {
      try {
        return decodeURIComponent(trimmed.slice(eqIdx + 1));
      } catch {
        return trimmed.slice(eqIdx + 1);
      }
    }
  }
  return null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return NextResponse.redirect(new URL('/login?error=oauth_cancelled', request.url));
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL('/login?error=oauth_invalid', request.url));
  }

  const cookieHeader = request.headers.get('cookie');
  const expectedState = readCookie(cookieHeader, 'oauth_state');
  const nextPath = sanitizeRedirectPath(readCookie(cookieHeader, 'oauth_next'));

  if (!expectedState || stateParam !== expectedState) {
    return NextResponse.redirect(new URL('/login?error=oauth_state', request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret || !isAuthConfigured()) {
    return NextResponse.redirect(new URL('/login?error=config', request.url));
  }

  const redirectUri = new URL('/api/auth/google/callback', request.url).toString();

  let email: string;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    const userData = (await userRes.json()) as { email?: string };
    if (!userData.email) {
      return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
    }

    email = userData.email;
  } catch {
    return NextResponse.redirect(new URL('/login?error=oauth_error', request.url));
  }

  if (!isAllowedEmail(email)) {
    return NextResponse.redirect(new URL('/login?error=credentials', request.url));
  }

  const token = await createSessionToken(email);
  const sessionCookie = getSessionCookieConfig(token);
  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  const { name, value, ...options } = sessionCookie;

  response.cookies.set(name, value, options);
  response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
  response.cookies.set('oauth_next', '', { maxAge: 0, path: '/' });

  return response;
}
