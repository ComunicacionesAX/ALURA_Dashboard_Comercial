import { NextResponse } from 'next/server';

import { getClearedSessionCookieConfig } from '@/lib/auth-core';

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL('/login?notice=signed-out', request.url)
  );
  const clearedCookie = getClearedSessionCookieConfig();
  const { name, value, ...options } = clearedCookie;

  response.cookies.set(name, value, options);

  return response;
}
