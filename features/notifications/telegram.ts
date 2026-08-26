import {
  formatReplyAlertMessage,
  splitTelegramChunks,
  type NotifySendResult,
  type ReplyNotifyInput,
} from '@/features/notifications/format-reply-alert';

function getConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  return { token, chatId };
}

export function isTelegramConfigured(): boolean {
  const { token, chatId } = getConfig();
  return Boolean(token && chatId);
}

export async function sendTelegramMessage(text: string): Promise<NotifySendResult> {
  const { token, chatId } = getConfig();

  if (!token) {
    console.warn('Telegram skipped: TELEGRAM_BOT_TOKEN is not set');
    return { success: false, skipped: true, error: 'TELEGRAM_BOT_TOKEN is not set', channel: 'telegram' };
  }

  if (!chatId) {
    console.warn('Telegram skipped: TELEGRAM_CHAT_ID is not set');
    return { success: false, skipped: true, error: 'TELEGRAM_CHAT_ID is not set', channel: 'telegram' };
  }

  try {
    // Plain text — reply bodies often break Markdown (*, _, `)
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      description?: string;
    };

    if (!response.ok || !data.ok) {
      const error = data.description || `Telegram HTTP ${response.status}`;
      console.error('Telegram error:', error);
      return { success: false, error, channel: 'telegram' };
    }

    return { success: true, channel: 'telegram' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send Telegram';
    console.error('Telegram send failed:', message);
    return { success: false, error: message, channel: 'telegram' };
  }
}

export async function notifyReplyOnTelegram(
  input: ReplyNotifyInput
): Promise<NotifySendResult> {
  // Include full body; split across messages if longer than Telegram limit
  const full = formatReplyAlertMessage(input, { includeBody: true, bodyMaxChars: 100_000 });
  const chunks = splitTelegramChunks(full);

  let lastError: string | undefined;

  for (let i = 0; i < chunks.length; i += 1) {
    const prefix = chunks.length > 1 ? `(${i + 1}/${chunks.length})\n` : '';
    const result = await sendTelegramMessage(`${prefix}${chunks[i]}`);
    if (!result.success) {
      if (result.skipped) return result;
      lastError = result.error;
      // If first chunk failed, treat as failure; later chunks continue best-effort
      if (i === 0) return result;
    }
  }

  if (lastError && chunks.length > 1) {
    return { success: true, channel: 'telegram', error: `Partial send: ${lastError}` };
  }

  return { success: true, channel: 'telegram' };
}
