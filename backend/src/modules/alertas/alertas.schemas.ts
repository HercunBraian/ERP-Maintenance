import { z } from 'zod';

export const alertaListQuerySchema = z.object({
  type: z.enum(['overdue', 'upcoming', 'low_stock']).optional(),
  severity: z.enum(['critical', 'warning', 'info']).optional(),
  resolved: z.enum(['true', 'false', 'all']).default('false'),
  cliente_id: z.string().uuid().optional(),
  entity_type: z.enum(['equipment', 'part']).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type AlertaListQuery = z.infer<typeof alertaListQuerySchema>;
