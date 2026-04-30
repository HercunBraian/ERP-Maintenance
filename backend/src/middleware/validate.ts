import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    // Reassign so coerced/transformed values are visible to downstream handlers.
    (req as unknown as Record<Source, unknown>)[source] = parsed;
    next();
  };
