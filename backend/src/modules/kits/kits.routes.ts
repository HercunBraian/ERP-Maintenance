import { Router } from 'express';
import * as ctl from './kits.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import {
  kitCreateSchema,
  kitUpdateSchema,
  kitListQuerySchema,
  idParamSchema,
  repuestoIdParamSchema,
  addKitPartSchema,
} from './kits.schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/',     validate(kitListQuerySchema, 'query'), asyncHandler(ctl.list));
router.get('/:id',  validate(idParamSchema, 'params'),     asyncHandler(ctl.get));
router.post('/',    requireRole('admin'), validate(kitCreateSchema), asyncHandler(ctl.create));
router.patch('/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(kitUpdateSchema),
  asyncHandler(ctl.update),
);
router.delete('/:id', requireRole('admin'), validate(idParamSchema, 'params'), asyncHandler(ctl.remove));

router.post('/:id/parts',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(addKitPartSchema),
  asyncHandler(ctl.addPart),
);
router.delete('/:id/parts/:repuestoId',
  requireRole('admin'),
  validate(repuestoIdParamSchema, 'params'),
  asyncHandler(ctl.removePart),
);

export default router;
