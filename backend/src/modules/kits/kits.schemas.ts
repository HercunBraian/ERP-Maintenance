import { z } from 'zod';

export const kitCreateSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(200),
  equipment_type: z.string().trim().min(1).max(60),
  brand: z.string().trim().max(80).optional(),
  frequency: z.enum(['1m', '3m', '6m', '12m', 'use']),
  estimated_time_min: z.coerce.number().int().nonnegative().default(0),
  price: z.coerce.number().nonnegative().default(0),
});

export const kitUpdateSchema = kitCreateSchema.partial();

export const kitListQuerySchema = z.object({
  equipment_type: z.string().optional(),
  brand: z.string().optional(),
  frequency: z.enum(['1m', '3m', '6m', '12m', 'use']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const repuestoIdParamSchema = z.object({
  id: z.string().uuid(),
  repuestoId: z.string().uuid(),
});

export const addKitPartSchema = z.object({
  repuesto_id: z.string().uuid(),
  qty: z.coerce.number().int().positive(),
});

export type KitCreate = z.infer<typeof kitCreateSchema>;
export type KitUpdate = z.infer<typeof kitUpdateSchema>;
export type KitListQuery = z.infer<typeof kitListQuerySchema>;
export type AddKitPart = z.infer<typeof addKitPartSchema>;
