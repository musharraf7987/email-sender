import { templateRepository } from '@/features/templates/template.repository';
import { seedDefaultTemplates } from '@/features/templates/seed-templates';
import {
  createTemplateSchema,
  updateTemplateSchema,
} from '@/features/templates/template.schema';
import { resumeRepository } from '@/features/resumes/resume.repository';
import { NotFoundError, ValidationError } from '@/lib/api/errors';

async function assertResumeExists(resumeId: string | null | undefined) {
  if (!resumeId) return;
  const resume = await resumeRepository.findMeta(resumeId);
  if (!resume) {
    throw new ValidationError('Selected resume not found');
  }
}

export async function listTemplates() {
  await seedDefaultTemplates();
  return templateRepository.findMany();
}

export async function getTemplate(id: string) {
  const template = await templateRepository.findUnique(id);
  if (!template) {
    throw new NotFoundError('Template not found');
  }
  return template;
}

export async function createTemplate(input: unknown) {
  const data = createTemplateSchema.parse(input);
  await assertResumeExists(data.resumeId);
  return templateRepository.create(data);
}

export async function updateTemplate(id: string, input: unknown) {
  const existing = await templateRepository.findUnique(id);
  if (!existing) {
    throw new NotFoundError('Template not found');
  }

  const data = updateTemplateSchema.parse(input);
  if ('resumeId' in data) {
    await assertResumeExists(data.resumeId);
  }
  return templateRepository.update(id, data);
}

export async function deleteTemplate(id: string): Promise<void> {
  const existing = await templateRepository.findUnique(id);
  if (!existing) {
    throw new NotFoundError('Template not found');
  }
  await templateRepository.delete(id);
}
