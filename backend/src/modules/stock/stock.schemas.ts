import { z } from 'zod';

export const stockListQuerySchema = z.object({
  deposito_id: z.string().uuid().optional(),
  repuesto_id: z.string().uuid().optional(),
  low_stock: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(5000).default(200),
  offset: z.coerce.number().int().min(0).default(0),
});

export const adjustStockSchema = z.object({
  repuesto_id: z.string().uuid(),
  deposito_id: z.string().uuid(),
  delta: z.coerce.number().int(),  // positive in, negative out
  notes: z.string().max(500).optional(),
});

export const setThresholdsSchema = z.object({
  repuesto_id:    z.string().uuid(),
  deposito_id:    z.string().uuid(),
  min_stock:      z.coerce.number().int().min(0),
  critical_stock: z.coerce.number().int().min(0),
});

export type StockListQuery  = z.infer<typeof stockListQuerySchema>;
export type AdjustStock     = z.infer<typeof adjustStockSchema>;
export type SetThresholds   = z.infer<typeof setThresholdsSchema>;
