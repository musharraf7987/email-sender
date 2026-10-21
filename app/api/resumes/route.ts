import { NextRequest } from 'next/server';
import { listResumes, uploadResume } from '@/features/resumes/resume.use-case';
import { requireTemplatesAuth } from '@/lib/templates-auth-guard';
import { withApiHandler } from '@/lib/api/handler';
import { ok } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export const GET = withApiHandler(async () => {
  const resumes = await listResumes();
  return ok({ resumes });
});

export const POST = withApiHandler(async (request: NextRequest) => {
  await requireTemplatesAuth();

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('Resume file is required');
  }

  const makeDefault =
    formData.get('isDefault') === 'true' || formData.get('isDefault') === '1';

  const resume = await uploadResume(file, makeDefault);
  return ok({ resume });
});
