import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { getExpiryDate } from '@/lib/applications';
import { companyNameFromEmail, extractDomain } from '@/lib/company';
import { applyTemplate, textToHtml } from '@/lib/template-utils';
import path from 'path';
import fs from 'fs';

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails, templateId, jobTitle, recruiterPhone } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one email address is required' },
        { status: 400 }
      );
    }

    if (!templateId || typeof templateId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Template is required' },
        { status: 400 }
      );
    }

    const resolvedJobTitle = typeof jobTitle === 'string' ? jobTitle.trim() : '';
    if (!resolvedJobTitle) {
      return NextResponse.json(
        { success: false, error: 'Job title is required' },
        { status: 400 }
      );
    }

    const invalidEmails = emails.filter((email: string) => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email address(es): ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    const subject = applyTemplate(template.subject, { jobTitle: resolvedJobTitle });
    const plainBody = applyTemplate(template.body, { jobTitle: resolvedJobTitle });
    const htmlBody = textToHtml(plainBody);

    const cvPath = path.join(process.cwd(), 'public', 'Musharraf-CV.pdf');

    if (!fs.existsSync(cvPath)) {
      return NextResponse.json(
        { success: false, error: 'CV file not found. Please ensure Musharraf-CV.pdf is in the public folder.' },
        { status: 500 }
      );
    }

    const cvBuffer = fs.readFileSync(cvPath);
    const results = [];
    const appliedAt = new Date();
    const expiresAt = getExpiryDate(appliedAt);
    const phone = typeof recruiterPhone === 'string' ? recruiterPhone.trim() || null : null;

    for (const email of emails) {
      const normalizedEmail = email.trim().toLowerCase();
      const domain = extractDomain(normalizedEmail);
      const companyName = companyNameFromEmail(normalizedEmail);

      try {
        const result = await sendEmail(
          normalizedEmail,
          subject,
          htmlBody,
          [
            {
              filename: 'Musharraf-CV.pdf',
              content: cvBuffer,
            },
          ]
        );

        const application = await prisma.application.create({
          data: {
            email: normalizedEmail,
            domain,
            companyName,
            jobType: template.name,
            subject,
            status: 'applied',
            appliedAt,
            expiresAt,
            messageId: result.messageId,
            emailSent: true,
            jobTitle: resolvedJobTitle,
            source: 'email-sender',
            recruiterPhone: phone,
          },
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

        const application = await prisma.application.create({
          data: {
            email: normalizedEmail,
            domain,
            companyName,
            jobType: template.name,
            subject,
            status: 'applied',
            appliedAt,
            expiresAt,
            emailSent: false,
            sendError: errorMessage,
            jobTitle: resolvedJobTitle,
            source: 'email-sender',
            recruiterPhone: phone,
          },
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

    return NextResponse.json({
      success: allSuccess,
      message: `${successCount} of ${emails.length} email(s) sent successfully`,
      results,
    });
  } catch (error: unknown) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send emails';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
