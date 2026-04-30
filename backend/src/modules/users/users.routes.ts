import { Router } from 'express';
import * as ctl from './users.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import {
  userCreateSchema,
  userUpdateSchema,
  resetPasswordSchema,
  userListQuerySchema,
  idParamSchema,
} from './users.schemas.js';

const router = Router();
router.use(requireAuth);

// Read: any authenticated user. RLS scopes: user sees self, admin sees all.
router.get('/',     validate(userListQuerySchema, 'query'), asyncHandler(ctl.list));
router.get('/:id',  validate(idParamSchema, 'params'),      asyncHandler(ctl.get));

// Create: admin only. Triggers handle_new_auth_user creates the public.users
// row, then we patch role/dept/etc as a second step.
router.post('/',
  requireRole('admin'),
  validate(userCreateSchema),
  asyncHandler(ctl.create),
);

// Update: any authenticated. RLS enforces self-update + admin-update; the
// users_self_update policy blocks self role changes.
router.patch('/:id',
  validate(idParamSchema, 'params'),
  validate(userUpdateSchema),
  asyncHandler(ctl.update),
);

// Reset password: admin only. Bypasses the "current password" requirement.
router.post('/:id/reset-password',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(resetPasswordSchema),
  asyncHandler(ctl.resetPassword),
);

// Hard-delete: admin only. Self-deletion blocked at the service layer.
router.delete('/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.remove),
);

export default router;
