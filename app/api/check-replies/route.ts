import { NextRequest } from 'next/server';
import { checkInboxReplies } from '@/features/replies/check-replies.use-case';
import { UnauthorizedError } from '@/lib/api/errors';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');

  if (authHeader || querySecret) {
    return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
  }

  return true;
};

async function handleCheck(request: NextRequest) {
  if (!isAuthorized(request)) {
    throw new UnauthorizedError();
  }

  const result = await checkInboxReplies();
  return ok({
    message:
      result.matched > 0
        ? `Found ${result.matched} new reply(ies)`
        : 'No new replies found',
    ...result,
  });
}

export const GET = withApiHandler(handleCheck);
export const POST = withApiHandler(handleCheck);
