import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const template = await prisma.emailTemplate.findUnique({ where: { id } });

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, template });
  } catch (error: unknown) {
    console.error('Template get error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch template';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    const data: { name?: string; jobType?: string; subject?: string; body?: string } = {};

    if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim();
    if (typeof body?.jobType === 'string' && body.jobType.trim()) data.jobType = body.jobType.trim();
    if (typeof body?.subject === 'string' && body.subject.trim()) data.subject = body.subject.trim();
    if (typeof body?.body === 'string' && body.body.trim()) data.body = body.body.trim();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const template = await prisma.emailTemplate.update({ where: { id }, data });

    return NextResponse.json({ success: true, template });
  } catch (error: unknown) {
    console.error('Template update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update template';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    await prisma.emailTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Template delete error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
