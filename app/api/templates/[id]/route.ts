import { NextRequest } from 'next/server';
import {
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from '@/features/templates/template.use-case';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  const template = await getTemplate(id);
  return ok({ template });
});

export const PATCH = withApiHandler(async (request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  const body = await request.json();
  const template = await updateTemplate(id, body);
  return ok({ template });
});

export const DELETE = withApiHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  await deleteTemplate(id);
  return ok({});
});
