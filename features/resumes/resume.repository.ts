import { prisma } from '@/lib/prisma';

const resumeMetaSelect = {
  id: true,
  name: true,
  mimeType: true,
  size: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ResumeMeta = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const resumeRepository = {
  findManyMeta: () =>
    prisma.resume.findMany({
      select: resumeMetaSelect,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),

  findMeta: (id: string) =>
    prisma.resume.findUnique({
      where: { id },
      select: resumeMetaSelect,
    }),

  findWithData: (id: string) =>
    prisma.resume.findUnique({ where: { id } }),

  findDefault: () =>
    prisma.resume.findFirst({
      where: { isDefault: true },
      orderBy: { updatedAt: 'desc' },
    }),

  create: (data: {
    name: string;
    data: Buffer;
    mimeType: string;
    size: number;
    isDefault: boolean;
  }) =>
    prisma.resume.create({
      data: {
        name: data.name,
        // Prisma Bytes typing is stricter than Node Buffer in some TS versions
        data: data.data as unknown as Uint8Array<ArrayBuffer>,
        mimeType: data.mimeType,
        size: data.size,
        isDefault: data.isDefault,
      },
      select: resumeMetaSelect,
    }),

  clearDefaultFlags: () =>
    prisma.resume.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    }),

  setDefault: (id: string) =>
    prisma.resume.update({
      where: { id },
      data: { isDefault: true },
      select: resumeMetaSelect,
    }),

  delete: (id: string) => prisma.resume.delete({ where: { id } }),

  countTemplatesUsing: (id: string) =>
    prisma.emailTemplate.count({ where: { resumeId: id } }),
};
