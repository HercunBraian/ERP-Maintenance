import { Router } from 'express';
import * as ctl from './mantenimientos.controller.js';
import { downloadPdf } from '../checklists/checklists.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import {
  mantCreateSchema,
  mantUpdateSchema,
  mantListQuerySchema,
  idParamSchema,
  partIdParamSchema,
  addPartSchema,
} from './mantenimientos.schemas.js';

const router = Router();
router.use(requireAuth);

// CRUD
router.get('/',     validate(mantListQuerySchema, 'query'), asyncHandler(ctl.list));
router.get('/:id',  validate(idParamSchema, 'params'),      asyncHandler(ctl.get));
// Both admin and technicians can create/update — RLS scopes technicians to
// their own (technician_id = auth.uid()).
router.post('/',    validate(mantCreateSchema), asyncHandler(ctl.create));
router.patch('/:id',
  validate(idParamSchema, 'params'),
  validate(mantUpdateSchema),
  asyncHandler(ctl.update),
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(ctl.remove));

// Status transitions
router.post('/:id/start',    validate(idParamSchema, 'params'), asyncHandler(ctl.start));
router.post('/:id/complete', validate(idParamSchema, 'params'), asyncHandler(ctl.complete));
router.post('/:id/cancel',   validate(idParamSchema, 'params'), asyncHandler(ctl.cancel));

// PDF report
router.get('/:id/pdf', validate(idParamSchema, 'params'), asyncHandler(downloadPdf));

// Parts consumed
router.post('/:id/parts',
  validate(idParamSchema, 'params'),
  validate(addPartSchema),
  asyncHandler(ctl.addPart),
);
router.delete('/:id/parts/:partId',
  validate(partIdParamSchema, 'params'),
  asyncHandler(ctl.removePart),
);

export default router;
