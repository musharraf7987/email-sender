import { prisma } from '@/lib/prisma';

export const templateRepository = {
  findMany: () =>
    prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    }),

  findUnique: (id: string) =>
    prisma.emailTemplate.findUnique({ where: { id } }),

  count: () => prisma.emailTemplate.count(),

  create: (data: { name: string; jobType: string; subject: string; body: string }) =>
    prisma.emailTemplate.create({ data }),

  update: (
    id: string,
    data: { name?: string; jobType?: string; subject?: string; body?: string }
  ) => prisma.emailTemplate.update({ where: { id }, data }),

  delete: (id: string) => prisma.emailTemplate.delete({ where: { id } }),
};
