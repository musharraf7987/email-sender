import { NextRequest, NextResponse } from 'next/server';
import {
  deleteResume,
  getResumeFile,
  setDefaultResume,
} from '@/features/resumes/resume.use-case';
import { requireTemplatesAuth } from '@/lib/templates-auth-guard';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (_request: NextRequest, context?: RouteContext) => {
  const { id } = await context!.params;
  const file = await getResumeFile(id);

  return new NextResponse(new Uint8Array(file.content), {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${file.filename.replace(/"/g, '')}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
});

export const PATCH = withApiHandler(async (request: NextRequest, context?: RouteContext) => {
  await requireTemplatesAuth();
  const { id } = await context!.params;
  const body = await request.json();

  if (body?.isDefault !== true) {
    throw new ValidationError('Only setting isDefault=true is supported');
  }

  const resume = await setDefaultResume(id);
  return ok({ resume });
});

export const DELETE = withApiHandler(async (_request: NextRequest, context?: RouteContext) => {
  await requireTemplatesAuth();
  const { id } = await context!.params;
  await deleteResume(id);
  return ok({});
});
