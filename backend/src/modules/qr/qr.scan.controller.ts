import type { Request, Response } from 'express';
import { isIP } from 'node:net';
import { supabaseAnon } from '../../lib/supabase.js';
import { AppError, mapPgError } from '../../lib/errors.js';

function clientIp(req: Request): string | null {
  const xff = req.get('x-forwarded-for');
  const raw = xff ? xff.split(',')[0]?.trim() : (req.socket.remoteAddress ?? null);
  if (!raw) return null;
  return isIP(raw) ? raw : null;
}

/**
 * Public scan endpoint. Calls the SECURITY DEFINER RPC `get_equipo_by_qr`,
 * which records the scan and returns minimal info regardless of auth.
 */
export async function scan(req: Request, res: Response) {
  const token = req.params.token!;
  const userAgent = req.get('user-agent') ?? null;
  const ip = clientIp(req);

  const { data, error } = await supabaseAnon.rpc('get_equipo_by_qr', {
    p_token: token,
    p_user_agent: userAgent,
    p_ip: ip,
  });
  if (error) throw mapPgError(error);

  // RPC returns an array (zero or one row).
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new AppError(404, 'Equipo not found for this QR token', 'QRNotFound');

  res.json(row);
}
