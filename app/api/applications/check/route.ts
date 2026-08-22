import { NextRequest } from 'next/server';
import { checkDuplicateEmails } from '@/features/applications/check-duplicates.use-case';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export const POST = withApiHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { duplicates } = await checkDuplicateEmails(body);
  return ok({ duplicates });
});
