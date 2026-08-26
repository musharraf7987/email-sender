import { NextRequest } from 'next/server';
import { sendWhatsAppMessage, isWhatsAppConfigured } from '@/features/notifications/whatsapp';
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

  if (!isWhatsAppConfigured()) {
    return fail(
      'WhatsApp not configured. Set WHATSAPP_API_KEY in .env (and optionally WHATSAPP_PHONE).',
      400
    );
  }

  const customText = request.nextUrl.searchParams.get('text');
  const text =
    customText?.trim() ||
    'This is a test from CallMeBot — email-sender WhatsApp alerts are working.';

  const result = await sendWhatsAppMessage(text);

  if (!result.success) {
    return fail(result.error || 'Failed to send WhatsApp message', 502);
  }

  return ok({
    message: 'WhatsApp test message sent. Check your phone.',
    phone: (process.env.WHATSAPP_PHONE || '917987942548').replace(/\D/g, ''),
  });
});
