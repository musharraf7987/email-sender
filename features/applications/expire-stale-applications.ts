import { applicationRepository } from '@/features/applications/application.repository';

export async function expireStaleApplications(): Promise<number> {
  const result = await applicationRepository.expireStale(new Date());
  return result.count;
}
