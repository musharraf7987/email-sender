import { cookies } from 'next/headers';
import { withApiHandler } from '@/lib/api/handler';
import { ok, fail } from '@/lib/api/response';
import {
  isTemplatesProtectionEnabled,
  setTemplatesAuthCookie,
  TEMPLATES_AUTH_COOKIE,
  verifyAuthToken,
  verifyTemplatesPassword,
} from '@/lib/templates-auth-guard';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async () => {
  const token = (await cookies()).get(TEMPLATES_AUTH_COOKIE)?.value;
  return ok({
    authenticated: verifyAuthToken(token),
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
