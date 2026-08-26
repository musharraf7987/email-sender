export type ReplyNotifyInput = {
  email: string;
  companyName: string | null;
  replySubject: string | null;
  replyFrom: string | null;
  replyBody?: string | null;
};

export type NotifySendResult = {
  success: boolean;
  skipped?: boolean;
  error?: string;
  channel?: 'telegram' | 'whatsapp';
};

/** Telegram max message length is 4096; leave room for safety. */
export const TELEGRAM_MAX_CHARS = 4000;
/** CallMeBot / WhatsApp — keep alerts shorter. */
export const WHATSAPP_BODY_MAX_CHARS = 2500;

/**
 * Keep only the new reply text — strip quoted original email
 * (Gmail "On ... wrote:", Outlook Original Message, > quoted lines, etc.)
 */
export function extractNewReplyOnly(body: string | null | undefined): string {
  if (!body) return '';

  let text = body.replace(/\r\n/g, '\n').trim();
  if (!text) return '';

  // Work on a padded string so ^-style markers also match at start of later lines
  const padded = `\n${text}`;
  const quoteMarkers: RegExp[] = [
    /\nOn\s+[^\n]{5,200}wrote:\s*/i,
    /\n-{2,}\s*Original Message\s*-{2,}/i,
    /\nFrom:\s+[^\n]+\nSent:\s+[^\n]+\nTo:\s+/i,
    /\n_{5,}\s*\n/,
    /\n-{5,}\s*\n/,
    /\nBegin forwarded message:?/i,
    /\nGet Outlook for /i,
    /\nLe\s+[^\n]{5,120}a\s+[ée]crit\s*:/i,
  ];

  let cutAt = padded.length;
  for (const pattern of quoteMarkers) {
    const match = pattern.exec(padded);
    if (match?.index != null && match.index > 0 && match.index < cutAt) {
      cutAt = match.index;
    }
  }

  text = padded.slice(1, cutAt).trim(); // drop leading \n from pad

  const lines = text.split('\n');
  while (lines.length > 0 && /^\s*>/.test(lines[lines.length - 1] || '')) {
    lines.pop();
  }

  let quoteStart = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const isQuote = /^\s*>/.test(lines[i] || '');
    if (isQuote) {
      if (quoteStart < 0) quoteStart = i;
      continue;
    }
    if (lines[i]?.trim()) quoteStart = -1;
  }
  if (quoteStart >= 0) {
    lines.splice(quoteStart);
  }

  return lines.join('\n').trim();
}

export function formatReplyAlertHeader(input: ReplyNotifyInput): string {
  const lines = [
    'New email reply!',
    '',
    `From: ${input.replyFrom || input.email}`,
    `Email: ${input.email}`,
    `Company: ${input.companyName || '—'}`,
  ];

  if (input.replySubject) {
    lines.push(`Subject: ${input.replySubject}`);
  }

  return lines.join('\n');
}

export function formatReplyAlertMessage(
  input: ReplyNotifyInput,
  options?: { includeBody?: boolean; bodyMaxChars?: number }
): string {
  const includeBody = options?.includeBody !== false;
  const bodyMax = options?.bodyMaxChars ?? TELEGRAM_MAX_CHARS;

  const header = formatReplyAlertHeader(input);
  const body = extractNewReplyOnly(input.replyBody);

  if (!includeBody || !body) {
    return `${header}\n\n(Open Application Tracker for the full reply.)`;
  }

  let replyText = body;
  let truncated = false;
  const reserved = header.length + '\n\nReply:\n'.length + 40;
  const maxBody = Math.max(500, bodyMax - reserved);

  if (replyText.length > maxBody) {
    replyText = `${replyText.slice(0, maxBody)}\n\n…(truncated)`;
    truncated = true;
  }

  const footer = truncated
    ? '\n\n(Full reply also saved in Application Tracker.)'
    : '';

  return `${header}\n\nReply:\n${replyText}${footer}`;
}

/** Split a long plain-text message into Telegram-safe chunks. */
export function splitTelegramChunks(text: string, maxChars = TELEGRAM_MAX_CHARS): string[] {
  if (text.length <= maxChars) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    let cut = remaining.lastIndexOf('\n', maxChars);
    if (cut < maxChars * 0.5) cut = maxChars;

    chunks.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).replace(/^\n+/, '');
  }

  return chunks;
}
