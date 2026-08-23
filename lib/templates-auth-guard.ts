import { cookies } from 'next/headers';
import {
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
  (await cookies()).set(
    TEMPLATES_AUTH_COOKIE,
    createAuthToken(),
    getTemplatesAuthCookieOptions()
  );
}

export { verifyTemplatesPassword, isTemplatesProtectionEnabled, verifyAuthToken, TEMPLATES_AUTH_COOKIE };
