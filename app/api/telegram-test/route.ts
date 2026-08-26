import { NextRequest } from 'next/server';
import { isTelegramConfigured, sendTelegramMessage } from '@/features/notifications/telegram';
import { UnauthorizedError } from '@/lib/api/errors';
import { withApiHandler } from '@/lib/api/handler';
import { fail, ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

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

export const GET = withApiHandler(async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    throw new UnauthorizedError();
  }

  if (!isTelegramConfigured()) {
    return fail(
      'Telegram not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env',
      400
    );
  }

  const customText = request.nextUrl.searchParams.get('text');
  const text =
    customText?.trim() ||
    '*Telegram test*\n\nemail-sender reply alerts are working.';

  const result = await sendTelegramMessage(text);

  if (!result.success) {
    return fail(result.error || 'Failed to send Telegram message', 502);
  }

  return ok({
    message: 'Telegram test message sent. Check your Telegram app.',
    chatId: process.env.TELEGRAM_CHAT_ID,
  });
});
