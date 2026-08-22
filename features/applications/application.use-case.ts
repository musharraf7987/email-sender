import { applicationRepository } from '@/features/applications/application.repository';
import { updateApplicationSchema } from '@/features/applications/application.schema';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { APPLICATION_STATUSES, JOB_TYPES } from '@/lib/job-templates';
import type { Application } from '@prisma/client';

export async function getApplication(id: string): Promise<Application> {
  const application = await applicationRepository.findUnique(id);
  if (!application) {
    throw new NotFoundError('Application not found');
  }
  return application;
}

export async function updateApplication(id: string, input: unknown): Promise<Application> {
  const body = updateApplicationSchema.parse(input);
  const data: Record<string, unknown> = { ...body };

  if ('status' in data && !APPLICATION_STATUSES.includes(data.status as typeof APPLICATION_STATUSES[number])) {
    throw new ValidationError('Invalid status');
  }

  if ('jobType' in data && !JOB_TYPES.includes(data.jobType as typeof JOB_TYPES[number])) {
    throw new ValidationError('Invalid job type');
  }

  if ('followUpDate' in data) {
    data.followUpDate = data.followUpDate ? new Date(data.followUpDate as string) : null;
  }

  if ('lastContactAt' in data) {
    data.lastContactAt = data.lastContactAt ? new Date(data.lastContactAt as string) : null;
  }

  try {
    return await applicationRepository.update(id, data);
  } catch {
    throw new NotFoundError('Application not found');
  }
}

export async function deleteApplication(id: string): Promise<void> {
  try {
    await applicationRepository.delete(id);
  } catch {
    throw new NotFoundError('Application not found');
  }
}
