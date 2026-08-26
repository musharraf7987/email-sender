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
  const notes: string[] = [];
  if (result.telegramNotified > 0) notes.push(`Telegram: ${result.telegramNotified}`);
  if (result.telegramFailed > 0) notes.push(`Telegram failed: ${result.telegramFailed}`);
  if (result.whatsappNotified > 0) notes.push(`WhatsApp: ${result.whatsappNotified}`);
  if (result.whatsappFailed > 0) notes.push(`WhatsApp failed: ${result.whatsappFailed}`);
  const alertNote = notes.length > 0 ? ` · ${notes.join(' · ')}` : '';

  return ok({
    message:
      result.matched > 0
        ? `Found ${result.matched} new reply(ies)${alertNote}`
        : 'No new replies found',
    ...result,
  });
}

export const GET = withApiHandler(handleCheck);
export const POST = withApiHandler(handleCheck);
