import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.code ?? err.name,
      message: err.message,
      details: err.details,
    });
  }
  console.error('[unhandled]', err);
  return res.status(500).json({ error: 'InternalServerError' });
}

/**
 * Translate a PostgREST/Postgres error into the right HTTP shape.
 * Used by every repository so they don't repeat themselves.
 */
export function mapPgError(error: PostgrestError): AppError {
  switch (error.code) {
    case '22023':    return new AppError(400, error.message, 'BadInput');
    case '23502':    return new AppError(400, error.message, 'NotNullViolation');
    case '23503':    return new AppError(409, 'Related records prevent this operation', 'ForeignKeyViolation', error.details);
    case '23505':    return new AppError(409, 'Duplicate value', 'DuplicateKey', error.details);
    case '23514':    return new AppError(409, error.message, 'CheckViolation');
    case '42501':    return new AppError(403, 'Forbidden by RLS', 'RLSDenied');
    case 'PGRST116': return new AppError(404, 'Not found', 'NotFound');
    case 'P0001':    return new AppError(400, error.message, 'RaisedException');
    default:         return new AppError(500, error.message || 'Database error', 'DBError', error.details);
  }
}
