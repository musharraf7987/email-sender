import { createHmac, timingSafeEqual } from 'crypto';

export const TEMPLATES_AUTH_COOKIE = 'templates_auth';
export const TEMPLATES_PIN = '871887';
export const TEMPLATES_PIN_LENGTH = TEMPLATES_PIN.length;

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
  return createHmac('sha256', TEMPLATES_PIN).update('templates-access').digest('hex');
}

export function verifyAuthToken(token: string | undefined): boolean {
  if (!token) return false;

  const expected = createAuthToken();
  if (token.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export const TEMPLATES_SESSION_SECONDS = 60; // 1 minute

export function getTemplatesAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: TEMPLATES_SESSION_SECONDS,
    path: '/',
  };
}
