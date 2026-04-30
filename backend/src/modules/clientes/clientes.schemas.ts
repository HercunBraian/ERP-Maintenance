import { z } from 'zod';

export const clienteCreateSchema = z.object({
  // `code` is auto-generated (bigint IDENTITY) — never accepted from clients.
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().optional(),
  contact_name: z.string().trim().max(200).optional(),
  type: z
    .enum(['Total Care', 'Remoto', 'Preventive', 'Total Remoto', 'Full Preventive', 'Otro'])
    .default('Total Care'),
  status: z.enum(['active', 'inactive']).default('active'),
  since: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').optional(),
  notes: z.string().max(2000).optional(),
});

export const clienteUpdateSchema = clienteCreateSchema.partial();

export const clienteListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({
  id: z.string().uuid('id must be a UUID'),
});

export type ClienteCreate = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdate = z.infer<typeof clienteUpdateSchema>;
export type ClienteListQuery = z.infer<typeof clienteListQuerySchema>;
