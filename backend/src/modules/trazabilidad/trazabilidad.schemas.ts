import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid() });

export const queryLimitSchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});
