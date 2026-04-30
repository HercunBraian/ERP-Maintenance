import type { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';
import { AppError, asyncHandler } from '../lib/errors.js';

export type Role = 'admin' | 'technician';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  fullName: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    accessToken?: string;
  }
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    console.log('❌ NO BEARER TOKEN');
    throw new AppError(401, 'Missing bearer token');
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    console.log('❌ TOKEN VACÍO');
    throw new AppError(401, 'Empty bearer token');
  }

  // 🔐 1. VALIDAR TOKEN
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    console.log('❌ TOKEN INVÁLIDO');
    throw new AppError(401, 'Invalid or expired token');
  }

  // 🔥 2. VER TODOS LOS USERS EN LA DB
  const { data: allUsers, error: allErr } = await supabaseAdmin
    .from('users')
    .select('id, email');

  // 🔥 3. BUSCAR POR ID (lo que vos querés validar)
  const { data: profile, error: pErr } = await supabaseAdmin
    .from('users')
    .select('id, email, role, full_name')
    .eq('id', data.user.id)
    .maybeSingle();

  if (pErr) {
    console.log('❌ DB ERROR:', pErr);
    throw new AppError(500, pErr.message, 'DBError');
  }

  if (!profile) {
    console.log('❌ PROFILE NOT FOUND (ID no coincide)');
    throw new AppError(403, 'No profile for authenticated user');
  }

  req.user = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    fullName: profile.full_name,
  };

  req.accessToken = token;

  next();
});

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError(401, 'Not authenticated');
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, `Requires role: ${roles.join(' | ')}`, 'ForbiddenRole');
    }
    next();
  };
}