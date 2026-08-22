import { applicationRepository } from '@/features/applications/application.repository';
import { listApplicationsSchema } from '@/features/applications/application.schema';
import { expireStaleApplications } from '@/features/applications/expire-stale-applications';
import type { PaginationMeta } from '@/types';
import type { Application } from '@prisma/client';

type ListApplicationsResult = {
  applications: Application[];
  statusCounts: Record<string, number>;
  pagination: PaginationMeta;
};

export async function listApplications(input: unknown): Promise<ListApplicationsResult> {
  await expireStaleApplications();

  const { status, search, page, limit } = listApplicationsSchema.parse(input);
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { companyName: { contains: search, mode: 'insensitive' as const } },
            { domain: { contains: search, mode: 'insensitive' as const } },
            { jobType: { contains: search, mode: 'insensitive' as const } },
            { recruiterPhone: { contains: search, mode: 'insensitive' as const } },
            { notes: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [applications, total, statusGroups] = await Promise.all([
    applicationRepository.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      skip,
      take: limit,
    }),
    applicationRepository.count(where),
    applicationRepository.groupByStatus(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const statusCounts = Object.fromEntries(
    statusGroups.map((group) => [group.status, group._count.status])
  );

  return {
    applications,
    statusCounts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
