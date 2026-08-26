import { notifyReplyOnTelegram } from '@/features/notifications/telegram';
import { notifyReplyOnWhatsApp } from '@/features/notifications/whatsapp';
import type { NotifySendResult, ReplyNotifyInput } from '@/features/notifications/format-reply-alert';

export type ReplyAlertResult = {
  notified: boolean;
  telegram: NotifySendResult;
  whatsapp: NotifySendResult;
};

/**
 * Prefer Telegram when configured; also try WhatsApp if key is set.
 * `notified` is true if at least one channel succeeded.
 */
export async function notifyReplyAlerts(input: ReplyNotifyInput): Promise<ReplyAlertResult> {
  const telegram = await notifyReplyOnTelegram(input);
  const whatsapp = await notifyReplyOnWhatsApp(input);

  return {
    notified: telegram.success || whatsapp.success,
    telegram,
    whatsapp,
  };
}
