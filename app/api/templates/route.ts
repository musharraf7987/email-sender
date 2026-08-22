import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { seedDefaultTemplates } from '@/lib/seed-templates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await seedDefaultTemplates();

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: unknown) {
    console.error('Templates list error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch templates';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const jobType = typeof body?.jobType === 'string' ? body.jobType.trim() : '';
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : '';
    const templateBody = typeof body?.body === 'string' ? body.body.trim() : '';

    if (!name || !jobType || !subject || !templateBody) {
      return NextResponse.json(
        { success: false, error: 'Name, job type, subject, and body are required' },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: { name, jobType, subject, body: templateBody },
    });

    return NextResponse.json({ success: true, template });
  } catch (error: unknown) {
    console.error('Template create error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create template';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
