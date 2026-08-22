export {
  JOB_TYPES,
  APPLICATION_STATUSES,
  type JobType,
  type ApplicationStatus,
  isValidJobType,
} from '@/lib/job-templates';

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const PAGE_SIZE = 10;

export type Priority = (typeof PRIORITIES)[number];
