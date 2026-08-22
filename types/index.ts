import type { Application, EmailTemplate } from '@prisma/client';

export type { Application, EmailTemplate };

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
