import { NextRequest } from 'next/server';
import { sendBulkEmail } from '@/features/email/send-bulk-email.use-case';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const POST = withApiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { allSuccess, message, results } = await sendBulkEmail(body);
  return ok({ success: allSuccess, message, results });
});
