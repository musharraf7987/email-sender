import { NextRequest } from 'next/server';
import {
  isTelegramConfigured,
  notifyReplyOnTelegram,
  sendTelegramMessage,
} from '@/features/notifications/telegram';
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

  const customText = request.nextUrl.searchParams.get('text')?.trim();

  const result = customText
    ? await sendTelegramMessage(customText)
    : await notifyReplyOnTelegram({
        email: 'hr@example.com',
        companyName: 'Example Corp',
        replySubject: 'Re: Application for React Developer',
        replyFrom: 'Test Recruiter <hr@example.com>',
        replyBody: [
          'Hi Musharraf,',
          '',
          'Thanks for applying. We liked your profile and would like to schedule a short call this week.',
          '',
          'Please share your availability.',
          '',
          'Best regards,',
          'HR Team',
          '',
          'On Mon, Aug 26, 2026 at 5:00 PM Musharraf Ansari <musharraf.code@gmail.com> wrote:',
          '> Name: Musharraf Ansari',
          '> Experience: 2.5 years',
          '> Skills: React...',
        ].join('\n'),
      });

  if (!result.success) {
    return fail(result.error || 'Failed to send Telegram message', 502);
  }

  return ok({
    message: 'Telegram test message sent (with sample full reply body). Check your Telegram app.',
    chatId: process.env.TELEGRAM_CHAT_ID,
  });
});
