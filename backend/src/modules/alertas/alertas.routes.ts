import { Router } from 'express';
import * as ctl from './alertas.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import { alertaListQuerySchema, idParamSchema } from './alertas.schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', validate(alertaListQuerySchema, 'query'), asyncHandler(ctl.list));

// Resolve is admin-only at the API; RLS also enforces admin for UPDATE on alertas.
router.post(
  '/:id/resolve',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.resolve),
);

export default router;
