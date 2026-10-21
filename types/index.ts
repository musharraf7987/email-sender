import type { Application, EmailTemplate as PrismaEmailTemplate } from '@prisma/client';

export type { Application };

export type ResumeMeta = {
  id: string;
  name: string;
  mimeType?: string;
  size: number;
  isDefault: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type EmailTemplate = PrismaEmailTemplate & {
  resume?: Pick<ResumeMeta, 'id' | 'name' | 'size' | 'isDefault'> | null;
};

export type DuplicateApplication = Pick<
  Application,
  'email' | 'jobType' | 'status' | 'appliedAt' | 'companyName' | 'emailSent'
>;

export type SendEmailResult = {
  email: string;
  success: boolean;
  message: string;
  messageId?: string;
  applicationId?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ApiSuccess<T> = { success: true } & T;
export type ApiError = { success: false; error: string; details?: unknown };
