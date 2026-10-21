import { z } from 'zod';

const resumeIdField = z
  .union([z.string().min(1), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === '' || value === null) return null;
    return value;
  });

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  jobType: z.string().trim().min(1, 'Job type is required'),
  subject: z.string().trim().min(1, 'Subject is required'),
  body: z.string().trim().min(1, 'Body is required'),
  resumeId: resumeIdField,
});

export const updateTemplateSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    jobType: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1).optional(),
    body: z.string().trim().min(1).optional(),
    resumeId: resumeIdField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No valid fields to update',
  });
