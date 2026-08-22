import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './errors';
import { fail } from './response';

type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context?: TContext
) => Promise<NextResponse>;

export function withApiHandler<TContext = unknown>(
  handler: RouteHandler<TContext>
): RouteHandler<TContext> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return fail('Validation failed', 400, error.flatten());
      }
      if (error instanceof AppError) {
        return fail(error.message, error.status, error.details);
      }
      console.error('API Error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      return fail(message, 500);
    }
  };
}
