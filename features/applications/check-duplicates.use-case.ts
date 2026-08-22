import { applicationRepository } from '@/features/applications/application.repository';
import { checkDuplicatesSchema, normalizeEmails } from '@/features/applications/application.schema';
import type { DuplicateApplication } from '@/types';

export async function checkDuplicateEmails(
  input: unknown
): Promise<{ duplicates: DuplicateApplication[] }> {
  const { emails } = checkDuplicatesSchema.parse(input);
  const normalized = normalizeEmails(emails);

  if (normalized.length === 0) {
    return { duplicates: [] };
  }

  const applications = await applicationRepository.findByEmails(normalized);

  const seen = new Set<string>();
  const duplicates = applications.filter((app) => {
    if (seen.has(app.email)) return false;
    seen.add(app.email);
    return true;
  });

  return { duplicates };
}
