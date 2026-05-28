import { cookies } from 'next/headers';

export * from './auth-core';

import {
  AUTH_COOKIE_NAME,
  isAuthConfigured,
  verifySessionToken,
} from './auth-core';

export async function getSessionFromCookies() {
  if (!isAuthConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null);
}
