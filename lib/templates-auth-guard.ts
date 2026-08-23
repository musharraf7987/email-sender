import { cookies } from 'next/headers';
import {
  clearTemplatesAuthCookieOptions,
  createAuthToken,
  getTemplatesAuthCookieOptions,
  isTemplatesProtectionEnabled,
  TEMPLATES_AUTH_COOKIE,
  verifyAuthToken,
  verifyTemplatesPassword,
} from '@/lib/templates-auth';
import { UnauthorizedError } from '@/lib/api/errors';

export async function requireTemplatesAuth(): Promise<void> {
  if (!isTemplatesProtectionEnabled()) return;

  const token = (await cookies()).get(TEMPLATES_AUTH_COOKIE)?.value;
  if (!verifyAuthToken(token)) {
    throw new UnauthorizedError('Templates access requires password');
  }
}

export async function setTemplatesAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(
    TEMPLATES_AUTH_COOKIE,
    createAuthToken(),
    getTemplatesAuthCookieOptions()
  );
  // Remove old cookie name from previous versions
  cookieStore.set('templates_auth', '', clearTemplatesAuthCookieOptions());
}

export async function clearTemplatesAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TEMPLATES_AUTH_COOKIE, '', clearTemplatesAuthCookieOptions());
  cookieStore.set('templates_auth', '', clearTemplatesAuthCookieOptions());
}

export { verifyTemplatesPassword, isTemplatesProtectionEnabled, verifyAuthToken, TEMPLATES_AUTH_COOKIE };
