import { prisma } from '@/lib/prisma';
import { templates, JOB_TYPES } from '@/lib/job-templates';

export const seedDefaultTemplates = async () => {
  const count = await prisma.emailTemplate.count();
  if (count > 0) return;

  await prisma.emailTemplate.createMany({
    data: JOB_TYPES.map((jobType) => ({
      name: jobType,
      jobType,
      subject: `Application for {{jobTitle}}`,
      body: templates[jobType].body,
    })),
  });
};
