import { z } from 'zod';

const equipmentStatus = z.enum(['operational', 'alert', 'overdue', 'maintenance', 'inactive']);

export const equipoCreateSchema = z.object({
  // `code` is auto-generated (bigint IDENTITY) — never accepted from clients.
  serial: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(60),
  category: z.string().trim().max(60).optional(),
  cliente_id: z.string().uuid(),
  install_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional(),
  maintenance_interval: z.enum(['1m', '3m', '6m', '12m']).default('6m'),
  location: z.string().trim().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const equipoUpdateSchema = equipoCreateSchema.partial().extend({
  status: equipmentStatus.optional(),
});

export const equipoListQuerySchema = z.object({
  cliente_id: z.string().uuid().optional(),
  status: equipmentStatus.optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export const qrQuerySchema = z.object({
  format: z.enum(['png', 'svg']).default('png'),
  size: z.coerce.number().int().min(64).max(2048).default(400),
  margin: z.coerce.number().int().min(0).max(10).default(2),
});

export type EquipoCreate = z.infer<typeof equipoCreateSchema>;
export type EquipoUpdate = z.infer<typeof equipoUpdateSchema>;
export type EquipoListQuery = z.infer<typeof equipoListQuerySchema>;
export type QRQuery = z.infer<typeof qrQuerySchema>;
