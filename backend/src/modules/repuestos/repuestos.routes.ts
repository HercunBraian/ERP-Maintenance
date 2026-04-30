import { Router } from 'express';
import * as ctl from './repuestos.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import {
  repuestoCreateSchema,
  repuestoUpdateSchema,
  repuestoListQuerySchema,
  idParamSchema,
} from './repuestos.schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/',     validate(repuestoListQuerySchema, 'query'), asyncHandler(ctl.list));
router.get('/:id',  validate(idParamSchema, 'params'),          asyncHandler(ctl.get));
router.post('/',    requireRole('admin'), validate(repuestoCreateSchema), asyncHandler(ctl.create));
router.patch('/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(repuestoUpdateSchema),
  asyncHandler(ctl.update),
);
router.delete('/:id', requireRole('admin'), validate(idParamSchema, 'params'), asyncHandler(ctl.remove));

export default router;
