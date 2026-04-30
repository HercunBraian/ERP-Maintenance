import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/errors.js';
import { scan } from './qr.scan.controller.js';

const router = Router();

// PUBLIC. No requireAuth.
// QR tokens are 16-hex-char by default (`encode(gen_random_bytes(8), 'hex')`),
// but accept any short non-empty string to allow custom tokens later.
router.get(
  '/:token',
  validate(z.object({ token: z.string().min(4).max(128) }), 'params'),
  asyncHandler(scan),
);

export default router;
