const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const normalizeEmails = (emails: string[]): string[] =>
  [
    ...new Set(
      emails
        .map(normalizeEmail)
        .filter((email) => email.length > 0 && isValidEmail(email))
    ),
  ];
