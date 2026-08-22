import { z } from 'zod';

export const sendEmailSchema = z.object({
  emails: z.array(z.string().email()).min(1, 'At least one email address is required'),
  templateId: z.string().min(1, 'Template is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  recruiterPhone: z.string().trim().optional(),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
