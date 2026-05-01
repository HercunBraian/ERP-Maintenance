import { Router } from 'express';
import { z } from 'zod';
import * as ctl from './catalog.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';

const nameSchema     = z.object({ name: z.string().trim().min(1).max(100) });
const idParam        = z.object({ id: z.string().uuid() });
const depositoSchema = z.object({
  code:    z.string().trim().min(1).max(20),
  name:    z.string().trim().min(1).max(100),
  address: z.string().trim().max(300).optional(),
});

const router = Router();
router.use(requireAuth);

// Equipment types
router.get('/equipment-types',         asyncHandler(ctl.listEquipmentTypes));
router.post('/equipment-types',        requireRole('admin'), validate(nameSchema),           asyncHandler(ctl.createEquipmentType));
router.delete('/equipment-types/:id',  requireRole('admin'), validate(idParam, 'params'),    asyncHandler(ctl.deleteEquipmentType));

// Equipment categories
router.get('/equipment-categories',        asyncHandler(ctl.listEquipmentCategories));
router.post('/equipment-categories',       requireRole('admin'), validate(nameSchema),           asyncHandler(ctl.createEquipmentCategory));
router.delete('/equipment-categories/:id', requireRole('admin'), validate(idParam, 'params'),    asyncHandler(ctl.deleteEquipmentCategory));

// Depositos
router.get('/depositos',         asyncHandler(ctl.listDepositos));
router.post('/depositos',        requireRole('admin'), validate(depositoSchema),              asyncHandler(ctl.createDeposito));
router.patch('/depositos/:id',   requireRole('admin'), validate(idParam, 'params'), validate(depositoSchema.partial()), asyncHandler(ctl.updateDeposito));
router.delete('/depositos/:id',  requireRole('admin'), validate(idParam, 'params'),           asyncHandler(ctl.deleteDeposito));

export default router;
