import { NextRequest } from 'next/server';
import {
  deleteApplication,
  getApplication,
  updateApplication,
} from '@/features/applications/application.use-case';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  const application = await getApplication(id);
  return ok({ application });
});

export const PATCH = withApiHandler(async (request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  const body = await request.json();
  const application = await updateApplication(id, body);
  return ok({ application });
});

export const DELETE = withApiHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  await deleteApplication(id);
  return ok({});
});
