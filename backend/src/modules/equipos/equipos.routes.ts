import { Router } from 'express';
import * as ctl from './equipos.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import {
  equipoCreateSchema,
  equipoUpdateSchema,
  equipoListQuerySchema,
  idParamSchema,
  qrQuerySchema,
} from './equipos.schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/',          validate(equipoListQuerySchema, 'query'), asyncHandler(ctl.list));
router.get('/:id',       validate(idParamSchema, 'params'),        asyncHandler(ctl.get));
router.get('/:id/full',  validate(idParamSchema, 'params'),        asyncHandler(ctl.getFull));
router.get('/:id/qr',
  validate(idParamSchema, 'params'),
  validate(qrQuerySchema, 'query'),
  asyncHandler(ctl.qr),
);
router.post('/',    requireRole('admin'), validate(equipoCreateSchema), asyncHandler(ctl.create));
router.patch('/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(equipoUpdateSchema),
  asyncHandler(ctl.update),
);
router.delete('/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.remove),
);

export default router;
