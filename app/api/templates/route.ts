import { NextRequest } from 'next/server';
import {
  createTemplate,
  listTemplates,
} from '@/features/templates/template.use-case';
import { requireTemplatesAuth } from '@/lib/templates-auth-guard';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async () => {
  const templates = await listTemplates();
  return ok({ templates });
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireTemplatesAuth();
  const body = await request.json();
  const template = await createTemplate(body);
  return ok({ template });
});
