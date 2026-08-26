import {
  formatReplyAlertMessage,
  WHATSAPP_BODY_MAX_CHARS,
  type NotifySendResult,
  type ReplyNotifyInput,
} from '@/features/notifications/format-reply-alert';

const DEFAULT_PHONE = '917987942548';

export type WhatsAppNotifyInput = ReplyNotifyInput;
export type WhatsAppSendResult = NotifySendResult;

function getConfig() {
  const phone = (process.env.WHATSAPP_PHONE || DEFAULT_PHONE).replace(/\D/g, '');
  const apikey = process.env.WHATSAPP_API_KEY?.trim();
  return { phone, apikey };
}

export function isWhatsAppConfigured(): boolean {
  const { phone, apikey } = getConfig();
  return Boolean(phone && apikey);
}

export { formatReplyAlertMessage };

export async function sendWhatsAppMessage(text: string): Promise<WhatsAppSendResult> {
  const { phone, apikey } = getConfig();

  if (!apikey) {
    console.warn('WhatsApp skipped: WHATSAPP_API_KEY is not set');
    return { success: false, skipped: true, error: 'WHATSAPP_API_KEY is not set', channel: 'whatsapp' };
  }

  if (!phone) {
    console.warn('WhatsApp skipped: WHATSAPP_PHONE is not set');
    return { success: false, skipped: true, error: 'WHATSAPP_PHONE is not set', channel: 'whatsapp' };
  }

  const url = new URL('https://api.callmebot.com/whatsapp.php');
  url.searchParams.set('phone', phone);
  url.searchParams.set('text', text);
  url.searchParams.set('apikey', apikey);

  try {
    const response = await fetch(url.toString(), { method: 'GET' });
    const body = await response.text();

    if (!response.ok) {
      console.error('CallMeBot error:', response.status, body);
      return {
        success: false,
        error: `CallMeBot HTTP ${response.status}: ${body}`,
        channel: 'whatsapp',
      };
    }

    if (
      /error|invalid|not activated|unauthorized/i.test(body) &&
      !/success|message queued|OK/i.test(body)
    ) {
      console.error('CallMeBot response:', body);
      return { success: false, error: body, channel: 'whatsapp' };
    }

    return { success: true, channel: 'whatsapp' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send WhatsApp';
    console.error('WhatsApp send failed:', message);
    return { success: false, error: message, channel: 'whatsapp' };
  }
}

export async function notifyReplyOnWhatsApp(
  input: WhatsAppNotifyInput
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage(
    formatReplyAlertMessage(input, {
      includeBody: true,
      bodyMaxChars: WHATSAPP_BODY_MAX_CHARS,
    })
  );
}
