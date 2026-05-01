import { Router } from 'express';
import { z } from 'zod';
import * as ctl from './stock.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import { stockListQuerySchema, adjustStockSchema, setThresholdsSchema } from './stock.schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', validate(stockListQuerySchema, 'query'), asyncHandler(ctl.list));

// adjust_stock RPC enforces admin-only via SECURITY DEFINER + is_admin() check.
router.post('/adjust', validate(adjustStockSchema), asyncHandler(ctl.adjust));

// Set min/critical stock thresholds for a stock row (admin only).
router.patch(
  '/thresholds',
  requireRole('admin'),
  validate(setThresholdsSchema),
  asyncHandler(ctl.setThresholds),
);

// Movement history for a single repuesto
router.get(
  '/movements/:repuestoId',
  validate(z.object({ repuestoId: z.string().uuid() }), 'params'),
  asyncHandler(ctl.movements),
);

export default router;
