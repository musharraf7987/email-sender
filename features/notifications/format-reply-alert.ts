export type ReplyNotifyInput = {
  email: string;
  companyName: string | null;
  replySubject: string | null;
  replyFrom: string | null;
};

export type NotifySendResult = {
  success: boolean;
  skipped?: boolean;
  error?: string;
  channel?: 'telegram' | 'whatsapp';
};

export function formatReplyAlertMessage(input: ReplyNotifyInput): string {
  const lines = [
    '*New email reply!*',
    '',
    `*From:* ${input.replyFrom || input.email}`,
    `*Email:* ${input.email}`,
    `*Company:* ${input.companyName || '—'}`,
  ];

  if (input.replySubject) {
    lines.push(`*Subject:* ${input.replySubject}`);
  }

  lines.push('', 'Open Application Tracker to view the full reply.');
  return lines.join('\n');
}
