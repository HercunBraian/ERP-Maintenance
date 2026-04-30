import { z } from 'zod';

export const repuestoCreateSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional(),
  unit: z.string().trim().min(1).max(20).default('unidad'),
  price: z.coerce.number().nonnegative().default(0),
  compatible_models: z.array(z.string()).default([]),
});

export const repuestoUpdateSchema = repuestoCreateSchema.partial();

export const repuestoListQuerySchema = z.object({
  search: z.string().trim().optional(),
  with_stock: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idParamSchema = z.object({ id: z.string().uuid() });

export type RepuestoCreate = z.infer<typeof repuestoCreateSchema>;
export type RepuestoUpdate = z.infer<typeof repuestoUpdateSchema>;
export type RepuestoListQuery = z.infer<typeof repuestoListQuerySchema>;
