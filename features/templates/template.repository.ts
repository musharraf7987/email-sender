import { prisma } from '@/lib/prisma';

const resumeMetaSelect = {
  id: true,
  name: true,
  size: true,
  isDefault: true,
} as const;

export const templateRepository = {
  findMany: () =>
    prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
      include: { resume: { select: resumeMetaSelect } },
    }),

  findUnique: (id: string) =>
    prisma.emailTemplate.findUnique({
      where: { id },
      include: { resume: { select: resumeMetaSelect } },
    }),

  count: () => prisma.emailTemplate.count(),

  create: (data: {
    name: string;
    jobType: string;
    subject: string;
    body: string;
    resumeId?: string | null;
  }) =>
    prisma.emailTemplate.create({
      data: {
        name: data.name,
        jobType: data.jobType,
        subject: data.subject,
        body: data.body,
        resumeId: data.resumeId ?? null,
      },
      include: { resume: { select: resumeMetaSelect } },
    }),

  update: (
    id: string,
    data: {
      name?: string;
      jobType?: string;
      subject?: string;
      body?: string;
      resumeId?: string | null;
    }
  ) =>
    prisma.emailTemplate.update({
      where: { id },
      data,
      include: { resume: { select: resumeMetaSelect } },
    }),

  delete: (id: string) => prisma.emailTemplate.delete({ where: { id } }),
};
