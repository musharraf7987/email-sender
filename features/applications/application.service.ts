export const APPLICATION_EXPIRY_DAYS = 15;

export const getExpiryDate = (appliedAt: Date = new Date()): Date => {
  const expiresAt = new Date(appliedAt);
  expiresAt.setDate(expiresAt.getDate() + APPLICATION_EXPIRY_DAYS);
  return expiresAt;
};

export { expireStaleApplications } from '@/features/applications/expire-stale-applications';
