import { Router } from 'express';
import * as ctl from './checklists.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import {
  templateCreateSchema,
  templateUpdateSchema,
  templateListQuerySchema,
  equipoChecklistSchema,
  saveAnswersSchema,
  idParamSchema,
  equipoIdParamSchema,
} from './checklists.schemas.js';

const router = Router();
router.use(requireAuth);

// ─── Templates CRUD ───────────────────────────────────────────────────────────
router.get('/templates',
  validate(templateListQuerySchema, 'query'),
  asyncHandler(ctl.listTemplates),
);
router.get('/templates/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.getTemplate),
);
router.post('/templates',
  requireRole('admin'),
  validate(templateCreateSchema),
  asyncHandler(ctl.createTemplate),
);
router.patch('/templates/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  validate(templateUpdateSchema),
  asyncHandler(ctl.updateTemplate),
);
router.delete('/templates/:id',
  requireRole('admin'),
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.deleteTemplate),
);

// ─── Equipment ↔ Checklist ────────────────────────────────────────────────────
router.get('/equipment/:equipoId',
  validate(equipoIdParamSchema, 'params'),
  asyncHandler(ctl.getEquipmentChecklist),
);
router.post('/equipment/:equipoId',
  requireRole('admin'),
  validate(equipoIdParamSchema, 'params'),
  validate(equipoChecklistSchema),
  asyncHandler(ctl.assignChecklist),
);

// ─── Maintenance execution ────────────────────────────────────────────────────
router.get('/maintenance/:id',
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.getMaintenanceChecklist),
);
router.patch('/maintenance/:id',
  validate(idParamSchema, 'params'),
  validate(saveAnswersSchema),
  asyncHandler(ctl.saveAnswers),
);
router.post('/maintenance/:id/complete',
  validate(idParamSchema, 'params'),
  asyncHandler(ctl.completeChecklist),
);

export default router;
