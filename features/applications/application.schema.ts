import { z } from 'zod';
import { normalizeEmails } from '@/lib/validators/email';

export const checkDuplicatesSchema = z.object({
  emails: z.array(z.string()).default([]),
});

export const listApplicationsSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const updateApplicationSchema = z
  .object({
    companyName: z.string().nullable().optional(),
    jobType: z.string().optional(),
    jobTitle: z.string().nullable().optional(),
    status: z.string().optional(),
    recruiterName: z.string().nullable().optional(),
    recruiterPhone: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    workMode: z.string().nullable().optional(),
    salary: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    priority: z.string().optional(),
    tags: z.string().nullable().optional(),
    followUpDate: z.union([z.string(), z.null()]).optional(),
    lastContactAt: z.union([z.string(), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No valid fields to update',
  });

export { normalizeEmails };
