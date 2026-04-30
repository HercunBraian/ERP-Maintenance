import { Router } from 'express';
import * as ctl from './trazabilidad.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import { idParamSchema } from './trazabilidad.schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/equipo/:id',  validate(idParamSchema, 'params'), asyncHandler(ctl.byEquipo));
router.get('/cliente/:id', validate(idParamSchema, 'params'), asyncHandler(ctl.byCliente));

export default router;
