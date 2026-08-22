import path from 'path';
import fs from 'fs';
import { applicationRepository } from '@/features/applications/application.repository';
import { getExpiryDate } from '@/features/applications/application.service';
import { sendEmail } from '@/features/email/mailer';
import { sendEmailSchema, type SendEmailInput } from '@/features/email/send-email.schema';
import { templateRepository } from '@/features/templates/template.repository';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { companyNameFromEmail, extractDomain } from '@/lib/company';
import { applyTemplate, textToHtml } from '@/lib/template-utils';
import { normalizeEmail } from '@/lib/validators/email';
import type { SendEmailResult } from '@/types';

const CV_FILENAME = 'Musharraf-CV.pdf';

function loadCvBuffer(): Buffer {
  const cvPath = path.join(process.cwd(), 'public', CV_FILENAME);
  if (!fs.existsSync(cvPath)) {
    throw new ValidationError(
      'CV file not found. Please ensure Musharraf-CV.pdf is in the public folder.'
    );
  }
  return fs.readFileSync(cvPath);
}

export async function sendBulkEmail(input: unknown): Promise<{
  allSuccess: boolean;
  message: string;
  results: SendEmailResult[];
}> {
  const { emails, templateId, jobTitle, recruiterPhone } = sendEmailSchema.parse(input);

  const template = await templateRepository.findUnique(templateId);
  if (!template) {
    throw new NotFoundError('Template not found');
  }

  const subject = applyTemplate(template.subject, { jobTitle });
  const plainBody = applyTemplate(template.body, { jobTitle });
  const htmlBody = textToHtml(plainBody);
  const cvBuffer = loadCvBuffer();

  const appliedAt = new Date();
  const expiresAt = getExpiryDate(appliedAt);
  const phone = recruiterPhone?.trim() || null;

  const results: SendEmailResult[] = [];

  for (const rawEmail of emails) {
    const normalizedEmail = normalizeEmail(rawEmail);
    const domain = extractDomain(normalizedEmail);
    const companyName = companyNameFromEmail(normalizedEmail);

    const baseData = {
      email: normalizedEmail,
      domain,
      companyName,
      jobType: template.name,
      subject,
      status: 'applied' as const,
      appliedAt,
      expiresAt,
      jobTitle,
      source: 'email-sender',
      recruiterPhone: phone,
    };

    try {
      const result = await sendEmail(normalizedEmail, subject, htmlBody, [
        { filename: CV_FILENAME, content: cvBuffer },
      ]);

      const application = await applicationRepository.create({
        ...baseData,
        messageId: result.messageId,
        emailSent: true,
      });

      results.push({
        email: normalizedEmail,
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId,
        applicationId: application.id,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send email';

      const application = await applicationRepository.create({
        ...baseData,
        emailSent: false,
        sendError: errorMessage,
      });

      results.push({
        email: normalizedEmail,
        success: false,
        message: errorMessage,
        applicationId: application.id,
      });
    }
  }

  const allSuccess = results.every((r) => r.success);
  const successCount = results.filter((r) => r.success).length;

  return {
    allSuccess,
    message: `${successCount} of ${emails.length} email(s) sent successfully`,
    results,
  };
}

export type { SendEmailInput };
