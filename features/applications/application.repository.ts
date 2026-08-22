import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export const applicationRepository = {
  findMany: (args: Prisma.ApplicationFindManyArgs) => prisma.application.findMany(args),

  findUnique: (id: string) => prisma.application.findUnique({ where: { id } }),

  findByEmails: (emails: string[]) =>
    prisma.application.findMany({
      where: { email: { in: emails } },
      orderBy: { appliedAt: 'desc' },
      select: {
        email: true,
        jobType: true,
        status: true,
        appliedAt: true,
        companyName: true,
        emailSent: true,
      },
    }),

  count: (where: Prisma.ApplicationWhereInput) => prisma.application.count({ where }),

  groupByStatus: () =>
    prisma.application.groupBy({
      by: ['status'],
      _count: { status: true },
    }),

  create: (data: Prisma.ApplicationCreateInput) => prisma.application.create({ data }),

  update: (id: string, data: Prisma.ApplicationUpdateInput) =>
    prisma.application.update({ where: { id }, data }),

  delete: (id: string) => prisma.application.delete({ where: { id } }),

  expireStale: (now: Date) =>
    prisma.application.updateMany({
      where: {
        status: 'applied',
        expiresAt: { lt: now },
      },
      data: { status: 'expired' },
    }),
};
