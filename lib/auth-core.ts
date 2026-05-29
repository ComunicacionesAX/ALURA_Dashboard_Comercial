export const AUTH_COOKIE_NAME = 'dashboard_session';

const DEFAULT_SESSION_HOURS = 12;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

type AllowedUsersInput =
  | Record<string, string | null>
  | Array<string>
  | Array<{ email: string; password?: string }>;

export interface SessionPayload {
  email: string;
  exp: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toBase64Url(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(base64url: string): Uint8Array {
  const normalized = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '='
  );

  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(padded, 'base64'));
  }

  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function safeJsonParse<T>(raw: string, envName: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(
      `La variable ${envName} no contiene un JSON valido: ${
        error instanceof Error ? error.message : 'error desconocido'
      }`
    );
  }
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error('Falta la variable AUTH_SECRET.');
  }
  return secret;
}

function getSessionDurationHours(): number {
  const raw = Number(process.env.AUTH_SESSION_HOURS ?? DEFAULT_SESSION_HOURS);
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_SESSION_HOURS;
  }
  return raw;
}

function getSessionDurationSeconds(): number {
  return Math.round(getSessionDurationHours() * 60 * 60);
}

function parseAllowedUsers(raw: string): Record<string, string | null> {
  const parsed = safeJsonParse<AllowedUsersInput>(raw, 'AUTH_ALLOWED_USERS');

  if (Array.isArray(parsed)) {
    return parsed.reduce<Record<string, string | null>>((acc, user) => {
      if (typeof user !== 'string' || !user.trim()) {
        throw new Error(
          'AUTH_ALLOWED_USERS debe ser un array de correos válidos cuando se usa lista blanca sin contraseñas.'
        );
      }
      acc[normalizeEmail(user)] = null;
      return acc;
    }, {});
  }

  return Object.entries(parsed).reduce<Record<string, string | null>>(
    (acc, [email, password]) => {
      const normalizedEmail = normalizeEmail(email);

      if (password === null || password === undefined || password === '') {
        acc[normalizedEmail] = null;
        return acc;
      }

      if (typeof password !== 'string') {
        throw new Error(
          'AUTH_ALLOWED_USERS debe ser un objeto email -> password o email -> null.'
        );
      }

      acc[normalizedEmail] = password;
      return acc;
    },
    {}
  );
}

function getEmailDomain(email: string): string | null {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : null;
}

function isAllowedEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  const users = getAllowedUsers();

  if (normalized in users) {
    return true;
  }

  const domain = getEmailDomain(normalized);
  if (!domain) {
    return false;
  }

  return `@${domain}` in users;
}

function getAllowedUsers(): Record<string, string | null> {
  const raw = process.env.AUTH_ALLOWED_USERS?.trim();
  if (!raw) {
    throw new Error('Falta la variable AUTH_ALLOWED_USERS.');
  }
  return parseAllowedUsers(raw);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getSessionDurationSeconds(),
  };
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  );

  return toBase64Url(new Uint8Array(signature));
}

async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < aBytes.length; index += 1) {
    result |= aBytes[index] ^ bBytes[index];
  }

  return result === 0;
}

function decodePayload(token: string): SessionPayload | null {
  const [payloadPart] = token.split('.');
  if (!payloadPart) {
    return null;
  }

  try {
    const json = decoder.decode(fromBase64Url(payloadPart));
    return JSON.parse(json) as SessionPayload;
  } catch {
    return null;
  }
}

function getCookieValueFromHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_COOKIE_NAME}=`));

  return match ? decodeURIComponent(match.slice(AUTH_COOKIE_NAME.length + 1)) : null;
}

export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET?.trim() && process.env.AUTH_ALLOWED_USERS?.trim()
  );
}

export function hasPasswordlessAllowedUsers(): boolean {
  const users = getAllowedUsers();
  return Object.values(users).some((value) => value === null);
}

export function shouldFailClosed(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.AUTH_FORCE === 'true'
  );
}

export function sanitizeRedirectPath(path: string | null | undefined): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }

  try {
    const url = new URL(path, 'http://localhost');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}

export function isAllowedCredentials(email: string, password: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  const users = getAllowedUsers();
  const userPassword = users[normalized];

  if (userPassword === null) {
    return true;
  }

  if (typeof userPassword === 'string' && userPassword === password) {
    return true;
  }

  const domain = getEmailDomain(normalized);
  if (!domain) {
    return false;
  }

  const wildcardKey = `@${domain}`;
  const wildcardPassword = users[wildcardKey];

  if (wildcardPassword === null) {
    return true;
  }

  return typeof wildcardPassword === 'string' && wildcardPassword === password;
}

export async function createSessionToken(email: string): Promise<string> {
  const payload: SessionPayload = {
    email: normalizeEmail(email),
    exp: Date.now() + getSessionDurationSeconds() * 1000,
  };

  const payloadPart = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signaturePart = await sign(payloadPart);

  return `${payloadPart}.${signaturePart}`;
}

export async function verifySessionToken(
  token: string | null | undefined
): Promise<SessionPayload | null> {
  if (!token || !isAuthConfigured()) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [payloadPart, signaturePart] = parts;
  const expectedSignature = await sign(payloadPart);
  const validSignature = await constantTimeEqual(signaturePart, expectedSignature);

  if (!validSignature) {
    return null;
  }

  const payload = decodePayload(token);
  if (!payload || !payload.email || typeof payload.exp !== 'number') {
    return null;
  }

  if (payload.exp <= Date.now()) {
    return null;
  }

  if (!isAllowedEmail(payload.email)) {
    return null;
  }

  return {
    email: normalizeEmail(payload.email),
    exp: payload.exp,
  };
}

export async function getSessionFromRequest(
  request: Request
): Promise<SessionPayload | null> {
  if (!isAuthConfigured()) {
    return null;
  }

  return verifySessionToken(getCookieValueFromHeader(request.headers.get('cookie')));
}

export async function requireApiSession(
  request: Request
): Promise<Response | null> {
  if (!isAuthConfigured()) {
    if (shouldFailClosed()) {
      return Response.json(
        { error: 'Falta configurar AUTH_SECRET y AUTH_ALLOWED_USERS.' },
        { status: 503 }
      );
    }

    return null;
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }

  return null;
}

export function getSessionCookieConfig(token: string) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    ...getCookieOptions(),
  };
}

export function getClearedSessionCookieConfig() {
  return {
    name: AUTH_COOKIE_NAME,
    value: '',
    ...getCookieOptions(),
    maxAge: 0,
  };
}
