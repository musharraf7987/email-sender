import { templateRepository } from '@/features/templates/template.repository';
import { seedDefaultTemplates } from '@/features/templates/seed-templates';
import {
  createTemplateSchema,
  updateTemplateSchema,
} from '@/features/templates/template.schema';
import { NotFoundError } from '@/lib/api/errors';
import type { EmailTemplate } from '@prisma/client';

export async function listTemplates(): Promise<EmailTemplate[]> {
  await seedDefaultTemplates();
  return templateRepository.findMany();
}

export async function getTemplate(id: string): Promise<EmailTemplate> {
  const template = await templateRepository.findUnique(id);
  if (!template) {
    throw new NotFoundError('Template not found');
  }
  return template;
}

export async function createTemplate(input: unknown): Promise<EmailTemplate> {
  const data = createTemplateSchema.parse(input);
  return templateRepository.create(data);
}

export async function updateTemplate(id: string, input: unknown): Promise<EmailTemplate> {
  const existing = await templateRepository.findUnique(id);
  if (!existing) {
    throw new NotFoundError('Template not found');
  }

  const data = updateTemplateSchema.parse(input);
  return templateRepository.update(id, data);
}

export async function deleteTemplate(id: string): Promise<void> {
  const existing = await templateRepository.findUnique(id);
  if (!existing) {
    throw new NotFoundError('Template not found');
  }
  await templateRepository.delete(id);
}
