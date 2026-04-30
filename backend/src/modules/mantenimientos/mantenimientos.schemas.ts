import { z } from 'zod';

const mantStatus = z.enum(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled']);
const mantTipo = z.enum(['preventive-6m', 'preventive-12m', 'corrective', 'use-based']);

export const mantCreateSchema = z.object({
  // `code` is auto-generated (bigint IDENTITY) — never accepted from clients.
  equipo_id: z.string().uuid(),
  tipo: mantTipo,
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  technician_id: z.string().uuid().nullable().optional(),
  kit_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).optional(),
});

export const mantUpdateSchema = mantCreateSchema.partial().extend({
  status: mantStatus.optional(),
});

export const mantListQuerySchema = z.object({
  equipo_id: z.string().uuid().optional(),
  cliente_id: z.string().uuid().optional(),
  technician_id: z.string().uuid().optional(),
  status: mantStatus.optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export const partIdParamSchema = z.object({
  id: z.string().uuid(),
  partId: z.string().uuid(),
});

export const addPartSchema = z.object({
  repuesto_id: z.string().uuid(),
  qty: z.coerce.number().int().positive(),
  deposito_id: z.string().uuid(),
});

export type MantCreate = z.infer<typeof mantCreateSchema>;
export type MantUpdate = z.infer<typeof mantUpdateSchema>;
export type MantListQuery = z.infer<typeof mantListQuerySchema>;
export type AddPart = z.infer<typeof addPartSchema>;
