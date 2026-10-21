import { cookies } from 'next/headers';
import { clearTemplatesAuthCookieOptions, TEMPLATES_AUTH_COOKIE } from '@/lib/templates-auth';
import { withApiHandler } from '@/lib/api/handler';
import { ok, fail } from '@/lib/api/response';
import {
  isTemplatesProtectionEnabled,
  setTemplatesAuthCookie,
  verifyAuthToken,
  verifyTemplatesPassword,
} from '@/lib/templates-auth-guard';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEMPLATES_AUTH_COOKIE)?.value;
  const authenticated = verifyAuthToken(token);

  if (!authenticated && token) {
    cookieStore.set(TEMPLATES_AUTH_COOKIE, '', clearTemplatesAuthCookieOptions());
  }

  return ok({
    authenticated,
    protected: isTemplatesProtectionEnabled(),
  });
});

export const POST = withApiHandler(async (request) => {
  if (!isTemplatesProtectionEnabled()) {
    return ok({ authenticated: true, protected: false });
  }

  const body = await request.json();
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!password) {
    return fail('Password is required', 400);
  }

  if (!verifyTemplatesPassword(password)) {
    return fail('Incorrect password', 401);
  }

  await setTemplatesAuthCookie();
  return ok({ authenticated: true });
});

export const DELETE = withApiHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.set(TEMPLATES_AUTH_COOKIE, '', clearTemplatesAuthCookieOptions());
  return ok({ authenticated: false });
});
