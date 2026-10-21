import { createHmac, timingSafeEqual } from 'crypto';

export const TEMPLATES_AUTH_COOKIE = 'templates_auth_v2';
export const TEMPLATES_PIN = '871887';
export const TEMPLATES_PIN_LENGTH = TEMPLATES_PIN.length;
/** Absolute session length after unlock */
export const TEMPLATES_SESSION_SECONDS = 10 * 60; // 10 minutes
/** Client locks after this much inactivity (must be ≤ session) */
export const TEMPLATES_IDLE_SECONDS = 3 * 60; // 3 minutes

export function isTemplatesProtectionEnabled(): boolean {
  return true;
}

export function verifyTemplatesPassword(password: string): boolean {
  if (password.length !== TEMPLATES_PIN.length) return false;

  try {
    return timingSafeEqual(Buffer.from(password), Buffer.from(TEMPLATES_PIN));
  } catch {
    return false;
  }
}

export function createAuthToken(): string {
  const expiresAt = Date.now() + TEMPLATES_SESSION_SECONDS * 1000;
  const signature = createHmac('sha256', TEMPLATES_PIN)
    .update(`templates-access:${expiresAt}`)
    .digest('hex');
  return `${expiresAt}.${signature}`;
}

export function verifyAuthToken(token: string | undefined): boolean {
  if (!token) return false;

  const [expiresStr, signature] = token.split('.');
  const expiresAt = Number(expiresStr);

  if (!expiresStr || !signature || Number.isNaN(expiresAt)) return false;
  if (Date.now() > expiresAt) return false;

  const expected = createHmac('sha256', TEMPLATES_PIN)
    .update(`templates-access:${expiresAt}`)
    .digest('hex');

  if (signature.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function getTemplatesAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: TEMPLATES_SESSION_SECONDS,
    path: '/',
  };
}

export function clearTemplatesAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };
}
